// Empty means same origin (the Vite dev proxy or a reverse proxy in production).
import { msg, t } from '@/i18n';

export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? '';

export class ApiClientError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
  }
}

interface ErrorPayload {
  message?: string;
  code?: string;
}

const fallbackMessage = (status: number): string => {
  if (status === 401)
    return msg('Your session has expired. Please login again.');
  if (status === 403)
    return msg('You do not have permission to perform this action.');
  if (status === 404) return msg('The requested resource could not be found.');
  if (status === 422) return msg('Validation failed. Please check your input.');
  return msg('Server error. Please try again later.');
};

const request = async <T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> => {
  // Files go up as raw bytes with their own content type; everything else is JSON.
  const isFile = body instanceof Blob;
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/v1${path}`, {
      method,
      headers:
        body === undefined
          ? undefined
          : { 'Content-Type': isFile ? body.type : 'application/json' },
      body:
        body === undefined ? undefined : isFile ? body : JSON.stringify(body),
      credentials: 'include',
    });
  } catch {
    throw new ApiClientError(
      t(msg('Network error. Please verify your connection and try again.')),
      0
    );
  }

  const payload = (await response.json().catch(() => null)) as
    ({ data?: T } & ErrorPayload) | null;

  if (!response.ok) {
    // /me is polled on public pages; its 401 just means "signed out".
    if (response.status === 401 && path !== '/me') {
      window.location.assign('/login');
    }
    // Server messages are English texts; the known ones are translated here for every caller.
    throw new ApiClientError(
      t(payload?.message ?? fallbackMessage(response.status)),
      response.status,
      payload?.code
    );
  }

  return payload?.data as T;
};

export const apiClient = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
  upload: <T>(path: string, file: File) => request<T>('POST', path, file),
};

// Uploaded files are served by the API origin, not by the SPA.
export const assetUrl = (path: string): string => `${API_BASE_URL}${path}`;
