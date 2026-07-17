import type { FileSource, FileSourceReader } from './types';

export class ViewerError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ViewerError';
  }
}

export async function normalizeFileSource(
  source: FileSource
): Promise<FileSourceReader> {
  switch (source.kind) {
    case 'file':
      return createFileReader(source.file);
    case 'handle':
      return createHandleReader(source.handle);
    case 'url':
      return createUrlReader(source.url, source.filename);
    case 'buffer':
      return createBufferReader(source.buffer, source.name, source.type);
    default:
      throw new ViewerError('INVALID_SOURCE', 'Unknown source kind');
  }
}

function createFileReader(file: File): FileSourceReader {
  return {
    meta: {
      name: file.name,
      size: file.size,
      mimeType: file.type || 'application/pdf',
      lastModified: file.lastModified,
    },
    arrayBuffer: () => file.arrayBuffer(),
    stream: () => file.stream() as ReadableStream<Uint8Array>,
  };
}

function createBufferReader(
  buffer: ArrayBuffer,
  name: string,
  type: string = 'application/pdf'
): FileSourceReader {
  return {
    meta: {
      name,
      size: buffer.byteLength,
      mimeType: type,
    },
    arrayBuffer: async () => buffer,
    stream: () => null,
  };
}

async function createHandleReader(
  handle: FileSystemFileHandle
): Promise<FileSourceReader> {
  const file = await handle.getFile();
  return createFileReader(file);
}

async function createUrlReader(
  url: string,
  filename?: string
): Promise<FileSourceReader> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new ViewerError(
      'NETWORK_ERROR',
      `HTTP ${response.status} fetching ${url}`,
      { status: response.status, retryable: response.status >= 500 }
    );
  }

  const blob = await response.blob();
  const mimeType = response.headers.get('content-type')?.split(';', 1)[0].trim()
    || blob.type
    || 'application/pdf';
  const name = filename || extractFilenameFromDisposition(response.headers.get('content-disposition'))
    || extractFilenameFromUrl(url)
    || (mimeType === 'application/pdf' ? 'document.pdf' : 'document');

  return {
    meta: {
      name,
      size: blob.size,
      mimeType,
    },
    arrayBuffer: () => blob.arrayBuffer(),
    stream: () => blob.stream() as ReadableStream<Uint8Array>,
  };
}

function extractFilenameFromUrl(url: string): string {
  try {
    const pathname = new URL(url, window.location.origin).pathname;
    const lastSlash = pathname.lastIndexOf('/');
    if (lastSlash !== -1 && lastSlash < pathname.length - 1) {
      return decodeURIComponent(pathname.slice(lastSlash + 1));
    }
  } catch {
    // fallback
  }
  return '';
}

function extractFilenameFromDisposition(value: string | null): string | null {
  if (!value) return null;
  const match = /filename\*?=(?:UTF-8''|\")?([^;\"]+)/i.exec(value);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1].trim());
  } catch {
    return match[1].trim();
  }
}
