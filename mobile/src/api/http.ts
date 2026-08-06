import { API_BASE_URL } from '../config/env';
import {
  storageDeleteItem,
  storageGetItem,
  storageSetItem,
} from './storage';

const TOKEN_KEY = 'cn_terminal_token';
const USER_KEY = 'cn_terminal_user';

/** Default fetch timeout — avoids hanging forever when the LAN IP is unreachable. */
const DEFAULT_TIMEOUT_MS = 20_000;

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiError extends Error {
  status?: number;
  details?: unknown;
  isNetworkError?: boolean;
  isTimeout?: boolean;
}

async function getAuthToken() {
  try {
    return (await storageGetItem(TOKEN_KEY)) ?? null;
  } catch {
    return null;
  }
}

export async function saveAuth(token: string, user: unknown) {
  await storageSetItem(TOKEN_KEY, token);
  await storageSetItem(USER_KEY, JSON.stringify(user));
}

export async function clearAuth() {
  await storageDeleteItem(TOKEN_KEY);
  await storageDeleteItem(USER_KEY);
}

export async function getStoredUser<T = unknown>(): Promise<T | null> {
  try {
    const value = await storageGetItem(USER_KEY);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export async function getStoredToken(): Promise<string | null> {
  return getAuthToken();
}

function networkError(cause?: unknown, timedOut = false): ApiError {
  const error: ApiError = new Error(
    timedOut
      ? `Request timed out reaching ${API_BASE_URL}. Check Wi‑Fi, that the backend is running, and EXPO_PUBLIC_API_URL (LAN IP may have changed).`
      : `Cannot reach the server at ${API_BASE_URL}. Check Wi‑Fi, that the backend is running, and EXPO_PUBLIC_API_URL (LAN IP may have changed).`,
  );
  error.isNetworkError = true;
  error.isTimeout = timedOut;
  error.details = cause;
  return error;
}

async function apiRequest<TResponse>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  options?: RequestInit,
): Promise<TResponse> {
  const token = await getAuthToken();
  const isFormData =
    typeof FormData !== 'undefined' && body instanceof FormData;

  const headers: HeadersInit = {
    Accept: 'application/json',
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options?.headers ?? {}),
  };

  if (token) {
    (headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  // Let fetch set multipart boundary for FormData
  if (isFormData) {
    delete (headers as Record<string, string>)['Content-Type'];
  }

  const url = `${API_BASE_URL}${path}`;
  const timeoutMs = DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const externalSignal = options?.signal;
  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', onExternalAbort);
    }
  }
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    const { signal: _ignored, ...restOptions } = options ?? {};
    response = await fetch(url, {
      method,
      headers,
      body:
        body == null
          ? undefined
          : isFormData
            ? (body as FormData)
            : JSON.stringify(body),
      ...restOptions,
      signal: controller.signal,
    });
  } catch (cause) {
    const aborted =
      (cause instanceof Error && cause.name === 'AbortError') ||
      controller.signal.aborted;
    // If the caller aborted, rethrow; otherwise treat as timeout / network failure.
    if (aborted && externalSignal?.aborted) {
      throw cause;
    }
    if (aborted) {
      throw networkError(cause, true);
    }
    throw networkError(cause, false);
  } finally {
    clearTimeout(timeoutId);
    externalSignal?.removeEventListener('abort', onExternalAbort);
  }

  const isJson = response.headers
    .get('content-type')
    ?.includes('application/json');

  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const error: ApiError = new Error(
      (data && ((data.message as string) || (data.error as string))) ||
        'Request failed',
    );
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data as TResponse;
}

export const api = {
  get: <TResponse>(path: string, options?: RequestInit) =>
    apiRequest<TResponse>('GET', path, undefined, options),
  post: <TResponse, TBody = unknown>(
    path: string,
    body: TBody,
    options?: RequestInit,
  ) => apiRequest<TResponse>('POST', path, body, options),
  put: <TResponse, TBody = unknown>(
    path: string,
    body: TBody,
    options?: RequestInit,
  ) => apiRequest<TResponse>('PUT', path, body, options),
  patch: <TResponse, TBody = unknown>(
    path: string,
    body: TBody,
    options?: RequestInit,
  ) => apiRequest<TResponse>('PATCH', path, body, options),
  delete: <TResponse>(path: string, options?: RequestInit) =>
    apiRequest<TResponse>('DELETE', path, undefined, options),
};
