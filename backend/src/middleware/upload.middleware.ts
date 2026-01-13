import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { createId } from '@paralleldrive/cuid2';

// Ensure uploads directory exists
const uploadsDir = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Allowed file types (15 MB max)
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB

const ALLOWED_MIME_TYPES = [
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/rtf',
  'text/plain',
  'text/csv',
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/tiff',
  'image/bmp',
  // Archives (optional)
  'application/zip',
  'application/x-rar-compressed',
];

const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.rtf', '.txt', '.csv',
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.tiff', '.bmp',
  '.zip', '.rar',
];

// Storage configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueId = createId();
    cb(null, `${uniqueId}${ext}`);
  },
});

// File filter
const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype;

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    cb(new Error(`Dateityp ${ext} ist nicht erlaubt. Erlaubte Typen: ${ALLOWED_EXTENSIONS.join(', ')}`));
    return;
  }

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    cb(new Error(`MIME-Typ ${mimeType} ist nicht erlaubt.`));
    return;
  }

  cb(null, true);
};

// Create multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

// Export constants for validation
export { MAX_FILE_SIZE, ALLOWED_MIME_TYPES, ALLOWED_EXTENSIONS, uploadsDir };
