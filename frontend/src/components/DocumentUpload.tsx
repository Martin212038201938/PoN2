import { useState, useRef, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Upload, X, FileText, Image, File, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '../utils/cn';

interface DocumentUploadProps {
  caseId: string;
  onUploadComplete?: () => void;
}

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB

const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.rtf', '.txt', '.csv',
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.tiff', '.bmp',
  '.zip', '.rar',
];

const DOCUMENT_TYPES = [
  { value: 'OTHER', label: 'Sonstiges' },
  { value: 'COURT_DOCUMENT', label: 'Gerichtsdokument' },
  { value: 'EMAIL', label: 'E-Mail' },
  { value: 'LETTER', label: 'Brief' },
  { value: 'INTERNAL_NOTE', label: 'Interne Notiz' },
  { value: 'COURT_INQUIRY', label: 'Gerichtsanfrage' },
  { value: 'COURT_RESPONSE', label: 'Gerichtsantwort' },
  { value: 'HEIR_CONTACT', label: 'Erbenkontakt' },
];

function getFileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'tiff', 'bmp'].includes(ext || '')) {
    return <Image className="w-5 h-5 text-green-600" />;
  }
  if (['pdf'].includes(ext || '')) {
    return <FileText className="w-5 h-5 text-red-600" />;
  }
  if (['doc', 'docx'].includes(ext || '')) {
    return <FileText className="w-5 h-5 text-blue-600" />;
  }
  return <File className="w-5 h-5 text-gray-600" />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentUpload({ caseId, onUploadComplete }: DocumentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('OTHER');
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error('Keine Datei ausgewählt');
      return api.uploadDocument(caseId, selectedFile, { type: documentType });
    },
    onSuccess: () => {
      setSelectedFile(null);
      setDocumentType('OTHER');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['case-documents', caseId] });
      onUploadComplete?.();
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Fehler beim Hochladen');
    },
  });

  const validateFile = useCallback((file: File): string | null => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `Dateityp ${ext} ist nicht erlaubt. Erlaubte Typen: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TXT, etc.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `Datei ist zu groß (${formatFileSize(file.size)}). Maximale Größe: 15 MB`;
    }
    return null;
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
    } else {
      setError(null);
      setSelectedFile(file);
    }
  }, [validateFile]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  }, [handleFileSelect]);

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate();
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
          dragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400',
          selectedFile && 'border-green-500 bg-green-50'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={ALLOWED_EXTENSIONS.join(',')}
          onChange={handleInputChange}
        />

        {selectedFile ? (
          <div className="flex items-center justify-center space-x-3">
            {getFileIcon(selectedFile.name)}
            <div className="text-left">
              <p className="font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                clearFile();
              }}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">
              Datei hierher ziehen oder <span className="text-primary-600 font-medium">klicken zum Auswählen</span>
            </p>
            <p className="text-sm text-gray-500 mt-1">
              PDF, DOC, DOCX, XLS, JPG, PNG, TXT, etc. (max. 15 MB)
            </p>
          </>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {uploadMutation.isSuccess && (
        <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-3 rounded-lg">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">Dokument erfolgreich hochgeladen!</p>
        </div>
      )}

      {/* Document Type & Upload Button */}
      {selectedFile && (
        <div className="flex items-end space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dokumenttyp
            </label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="input"
            >
              {DOCUMENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploadMutation.isPending}
            className="btn-primary flex items-center"
          >
            {uploadMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Lädt hoch...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Hochladen
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
