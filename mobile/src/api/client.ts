import { API_ORIGIN } from '@/config/env';
import { t } from '@/i18n';
import { tokenStore } from '@/storage/token';
import { ApiError, NETWORK_ERROR_STATUS } from './errors';

const REQUEST_TIMEOUT_MS = 15_000;

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue>;

interface ErrorBody {
  message?: string;
  code?: string;
}

interface RequestOptions {
  method: HttpMethod;
  // Starts at the origin, for example `/api/v1/me` or `/api/auth/sign-out`.
  path: string;
  body?: unknown;
  query?: QueryParams;
  // Sign-in and sign-out handle their own 401, they are not an "expired session".
  ownsUnauthorized?: boolean;
}

export interface ApiResponse<T> {
  body: T;
  headers: Headers;
}

let unauthorizedHandler: (() => void) | null = null;

// The session provider registers what happens when the server rejects the token.
export const setUnauthorizedHandler = (handler: (() => void) | null): void => {
  unauthorizedHandler = handler;
};

const fallbackMessage = (status: number): string => {
  if (status === 401)
    return t('Your session has expired. Please sign in again.');
  if (status === 403)
    return t('You do not have permission to perform this action.');
  if (status === 404) return t('The requested resource could not be found.');
  if (status === 422) return t('Validation failed. Please check your input.');
  if (status === 429) return t('Too many attempts. Please wait and try again.');
  return t('Server error. Please try again later.');
};

const buildUrl = (path: string, query?: QueryParams): string => {
  const params = Object.entries(query ?? {})
    .filter(([, value]) => value !== undefined && value !== null)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
    );
  return `${API_ORIGIN}${path}${params.length > 0 ? `?${params.join('&')}` : ''}`;
};

const parseJson = async (response: Response): Promise<unknown> => {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};

export const request = async <T>({
  method,
  path,
  body,
  query,
  ownsUnauthorized = false,
}: RequestOptions): Promise<ApiResponse<T>> => {
  const token = tokenStore.get();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      signal: controller.signal,
      // The app authenticates with the bearer token. Without this, the phone also keeps the session cookie the
      // server sets and sends it back, and Better Auth then demands a browser Origin header ("Missing or null Origin").
      credentials: 'omit',
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      t('Cannot reach the gym server. Check your connection and try again.'),
      NETWORK_ERROR_STATUS
    );
  } finally {
    clearTimeout(timer);
  }

  const parsed = await parseJson(response);
  if (!response.ok) {
    const error = (parsed ?? {}) as ErrorBody;
    if (response.status === 401 && token && !ownsUnauthorized) {
      unauthorizedHandler?.();
    }
    // Server messages are English texts; the known ones are translated here for every caller.
    throw new ApiError(
      t(error.message ?? fallbackMessage(response.status)),
      response.status,
      error.code
    );
  }
  return { body: parsed as T, headers: response.headers };
};

const API_PREFIX = '/api/v1';

// Calls to `/api/v1`; the answer is always `{ data }`, so only the data is returned.
const call = async <T>(
  method: HttpMethod,
  path: string,
  options: { body?: unknown; query?: QueryParams } = {}
): Promise<T> => {
  const { body } = await request<{ data: T }>({
    method,
    path: `${API_PREFIX}${path}`,
    ...options,
  });
  return body.data;
};

export const apiClient = {
  get: <T>(path: string, query?: QueryParams) =>
    call<T>('GET', path, { query }),
  post: <T>(path: string, body?: unknown) => call<T>('POST', path, { body }),
  put: <T>(path: string, body?: unknown) => call<T>('PUT', path, { body }),
  patch: <T>(path: string, body?: unknown) => call<T>('PATCH', path, { body }),
  delete: <T>(path: string) => call<T>('DELETE', path),
};

// Uploaded files (photos) are served by the API origin, not under `/api/v1`.
export const assetUrl = (path: string): string =>
  path.startsWith('http') ? path : `${API_ORIGIN}${path}`;
