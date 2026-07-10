export type ViewerErrorCode =
  | 'PARSE_ERROR' // PDF.js failed to parse
  | 'RENDER_ERROR' // Failed to render a page
  | 'PASSWORD_REQUIRED'
  | 'PASSWORD_INCORRECT'
  | 'UNSUPPORTED_FORMAT'
  | 'NETWORK_ERROR'
  | 'CORRUPT_FILE'
  | 'MEMORY_LIMIT'
  | 'WORKER_ERROR'
  | 'INVALID_SOURCE';

export interface ViewerErrorOptions {
  cause?: unknown;
  retryable?: boolean;
}

export class ViewerError extends Error {
  public readonly code: ViewerErrorCode;
  public readonly rootCause?: unknown;
  public readonly retryable: boolean;

  constructor(
    code: ViewerErrorCode,
    message: string,
    options?: ViewerErrorOptions
  ) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = 'ViewerError';
    this.code = code;
    this.rootCause = options?.cause;
    this.retryable = options?.retryable ?? false;
  }
}

export function isViewerError(value: unknown): value is ViewerError {
  return value instanceof ViewerError;
}