// File configuration and utilities for Knowledge Hub
export const FILE_CONFIG = {
  // Maximum file size (10MB)
  MAX_SIZE: 10 * 1024 * 1024,
  
  // Supported file types
  SUPPORTED_TYPES: {
    DOCUMENTS: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
      'application/rtf'
    ],
    SPREADSHEETS: [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ],
    PRESENTATIONS: [
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ],
    IMAGES: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'image/tiff'
    ],
    AUDIO: [
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/mp4'
    ],
    VIDEO: [
      'video/mp4',
      'video/avi',
      'video/mov',
      'video/wmv'
    ]
  }
};

// Get file type category
export function getFileCategory(mimeType: string): string {
  for (const [category, types] of Object.entries(FILE_CONFIG.SUPPORTED_TYPES)) {
    if (types.includes(mimeType)) {
      return category.toLowerCase();
    }
  }
  return 'other';
}

// Get file icon based on type
export function getFileIcon(mimeType: string): string {
  const category = getFileCategory(mimeType);
  const iconMap: Record<string, string> = {
    documents: '📄',
    spreadsheets: '📊',
    presentations: '📽️',
    images: '🖼️',
    audio: '🎵',
    video: '🎬',
    other: '📎'
  };
  return iconMap[category] || '📎';
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Check if file type is supported
export function isSupportedFileType(mimeType: string): boolean {
  return Object.values(FILE_CONFIG.SUPPORTED_TYPES)
    .flat()
    .includes(mimeType);
}

// Generate safe filename
export function generateSafeFilename(originalName: string): string {
  // Remove or replace unsafe characters
  const safeName = originalName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '');
  
  return safeName || 'unnamed_file';
}

// Get file extension from filename or mime type
export function getFileExtension(filename: string, mimeType?: string): string {
  // Priority 1: Get extension from filename
  const fromName = filename.split('.').pop()?.toLowerCase();
  if (fromName && fromName !== filename.toLowerCase()) {
    return fromName;
  }

  if (!mimeType) return 'bin';

  // Priority 2: Simple mime type mapping
  const simpleMimeMap: Record<string, string> = {
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'text/plain': 'txt',
    'text/markdown': 'md',
    'text/csv': 'csv',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'video/mpeg': 'mpeg',
    'audio/mpeg': 'mp3',
  };

  if (simpleMimeMap[mimeType]) {
    return simpleMimeMap[mimeType];
  }

  // Priority 3: Handle complex Office MIME types
  if (mimeType.includes('vnd.openxmlformats-officedocument')) {
    if (mimeType.includes('wordprocessingml')) return 'docx';
    if (mimeType.includes('spreadsheetml')) return 'xlsx';
    if (mimeType.includes('presentationml')) return 'pptx';
  }
  
  if (mimeType.includes('vnd.ms-excel')) return 'xls';
  if (mimeType.includes('vnd.ms-powerpoint')) return 'ppt';

  // Fallback: try to get it from the mime type string itself
  const fromMime = mimeType.split('/').pop();
  if (fromMime) {
    return fromMime.split('+')[0]; // Handles cases like 'svg+xml' -> 'svg'
  }

  return 'bin';
}
