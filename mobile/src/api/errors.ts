export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

// Status 0 is used when the server could not be reached at all.
export const NETWORK_ERROR_STATUS = 0;

export const isNetworkError = (error: unknown): boolean =>
  error instanceof ApiError && error.status === NETWORK_ERROR_STATUS;

export const isClientError = (error: unknown): boolean =>
  error instanceof ApiError && error.status >= 400 && error.status < 500;
