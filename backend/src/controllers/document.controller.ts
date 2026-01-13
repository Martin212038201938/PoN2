import { Request, Response } from 'express';
import { db } from '../db';
import { documents, cases } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import fs from 'fs';

interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string };
}

export const documentController = {
  // List documents for a case
  async listByCaseId(req: AuthRequest, res: Response) {
    try {
      const { caseId } = req.params;

      // Verify case exists
      const caseExists = await db.select().from(cases).where(eq(cases.id, caseId)).limit(1);
      if (caseExists.length === 0) {
        return res.status(404).json({ error: 'Fall nicht gefunden' });
      }

      const docs = await db
        .select()
        .from(documents)
        .where(eq(documents.caseId, caseId))
        .orderBy(desc(documents.createdAt));

      return res.json({ documents: docs });
    } catch (error) {
      console.error('Error listing documents:', error);
      return res.status(500).json({ error: 'Fehler beim Laden der Dokumente' });
    }
  },

  // Upload document
  async upload(req: AuthRequest, res: Response) {
    try {
      const { caseId } = req.params;
      const file = req.file;
      const userId = req.user?.id;

      if (!file) {
        return res.status(400).json({ error: 'Keine Datei hochgeladen' });
      }

      // Verify case exists
      const caseExists = await db.select().from(cases).where(eq(cases.id, caseId)).limit(1);
      if (caseExists.length === 0) {
        // Delete uploaded file if case doesn't exist
        fs.unlinkSync(file.path);
        return res.status(404).json({ error: 'Fall nicht gefunden' });
      }

      // Parse additional data from body
      const { type = 'OTHER', subject, content } = req.body;

      const docId = createId();
      const newDoc = await db
        .insert(documents)
        .values({
          id: docId,
          caseId,
          type,
          direction: 'INBOUND',
          subject: subject || file.originalname,
          content: content || null,
          fileName: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          fileSize: file.size,
          filePath: file.path,
          uploadedById: userId,
        })
        .returning();

      return res.status(201).json({ document: newDoc[0] });
    } catch (error) {
      console.error('Error uploading document:', error);
      // Clean up file on error
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch {}
      }
      return res.status(500).json({ error: 'Fehler beim Hochladen des Dokuments' });
    }
  },

  // Download document
  async download(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const doc = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
      if (doc.length === 0) {
        return res.status(404).json({ error: 'Dokument nicht gefunden' });
      }

      const document = doc[0];
      if (!document.filePath || !document.fileName) {
        return res.status(404).json({ error: 'Keine Datei für dieses Dokument vorhanden' });
      }

      // Check if file exists
      if (!fs.existsSync(document.filePath)) {
        return res.status(404).json({ error: 'Datei nicht gefunden' });
      }

      // Set headers for download
      res.setHeader('Content-Disposition', `attachment; filename="${document.originalName || document.fileName}"`);
      res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');

      // Stream file
      const fileStream = fs.createReadStream(document.filePath);
      fileStream.pipe(res);
      return;
    } catch (error) {
      console.error('Error downloading document:', error);
      return res.status(500).json({ error: 'Fehler beim Herunterladen des Dokuments' });
    }
  },

  // Delete document
  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const doc = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
      if (doc.length === 0) {
        return res.status(404).json({ error: 'Dokument nicht gefunden' });
      }

      const document = doc[0];

      // Delete file from disk
      if (document.filePath && fs.existsSync(document.filePath)) {
        fs.unlinkSync(document.filePath);
      }

      // Delete from database
      await db.delete(documents).where(eq(documents.id, id));

      return res.json({ message: 'Dokument gelöscht' });
    } catch (error) {
      console.error('Error deleting document:', error);
      return res.status(500).json({ error: 'Fehler beim Löschen des Dokuments' });
    }
  },

  // Get single document
  async getById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const doc = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
      if (doc.length === 0) {
        return res.status(404).json({ error: 'Dokument nicht gefunden' });
      }

      return res.json({ document: doc[0] });
    } catch (error) {
      console.error('Error getting document:', error);
      return res.status(500).json({ error: 'Fehler beim Laden des Dokuments' });
    }
  },
};
