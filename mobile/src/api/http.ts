import { API_BASE_URL } from '../config/env';
import {
  storageDeleteItem,
  storageGetItem,
  storageSetItem,
} from './storage';

const TOKEN_KEY = 'cn_terminal_token';
const USER_KEY = 'cn_terminal_user';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiError extends Error {
  status?: number;
  details?: unknown;
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

async function apiRequest<TResponse>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  options?: RequestInit,
): Promise<TResponse> {
  const token = await getAuthToken();

  const headers: HeadersInit = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(options?.headers ?? {}),
  };

  if (token) {
    (headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
    ...options,
  });

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
