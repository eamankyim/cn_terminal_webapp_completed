import { api } from './http';

interface ConfigResponse {
  success?: boolean;
  data?: { key: string; value: string; type: string };
}

interface EnsureListResponse {
  success?: boolean;
  data?: { key: string; list: string[] };
}

interface ListItemsResponse {
  success?: boolean;
  data?: {
    key: string;
    list: string[];
    added?: string[];
    created?: boolean;
    value?: string;
  };
}

export const GOODS_TYPES_CONFIG_KEY = 'GOODS_TYPES';
export const VESSEL_NAMES_CONFIG_KEY = 'VESSEL_NAMES';
export const SHIPPING_LINES_CONFIG_KEY = 'SHIPPING_LINES';
export const TERMINAL_NAMES_CONFIG_KEY = 'TERMINAL_NAMES';

export type ListMeta = {
  category?: string;
  description?: string;
};

const listCache = new Map<string, { list: string[]; expiresAt: number }>();
const CACHE_TTL_MS = 30_000;

function getCachedList(key: string): string[] | null {
  const entry = listCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    listCache.delete(key);
    return null;
  }
  return entry.list;
}

function setCachedList(key: string, list: string[]) {
  listCache.set(key, { list: [...list], expiresAt: Date.now() + CACHE_TTL_MS });
}

function invalidateCachedList(key: string) {
  listCache.delete(key);
}

export function normalizeStringList(list: unknown): string[] {
  if (!Array.isArray(list)) return [];
  return [
    ...new Set(list.map((t) => String(t).trim()).filter(Boolean)),
  ];
}

async function fetchStoredList(key: string): Promise<string[] | null> {
  try {
    const res = await api.get<ConfigResponse>(`/configurations/${key}`);
    const raw = res?.data?.value;
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return normalizeStringList(parsed);
    }
    return null;
  } catch (error: any) {
    if (error?.status === 404) return null;
    throw error;
  }
}

export async function saveStringList(
  key: string,
  list: string[],
  meta: ListMeta = {},
): Promise<void> {
  invalidateCachedList(key);
  await api.post('/configurations', {
    key,
    value: JSON.stringify(normalizeStringList(list)),
    type: 'JSON',
    category: meta.category || 'JOBS',
    description: meta.description || key,
  });
}

/**
 * Load a JSON string-list config.
 * Ensures defaults only when missing — never overwrites custom values.
 * On network errors returns defaults for UI only (does not overwrite DB).
 */
export async function loadStringList(
  key: string,
  defaults: string[],
  meta: ListMeta = {},
): Promise<string[]> {
  const cached = getCachedList(key);
  if (cached && cached.length > 0) return cached;

  const seeded = normalizeStringList(defaults);

  try {
    const stored = await fetchStoredList(key);
    if (stored && stored.length > 0) {
      setCachedList(key, stored);
      return stored;
    }

    const res = await api.post<EnsureListResponse>(
      `/configurations/${key}/ensure-list`,
      {
        defaults: seeded,
        category: meta.category || 'JOBS',
        description: meta.description || key,
      },
    );
    const list = normalizeStringList(res?.data?.list ?? seeded);
    setCachedList(key, list);
    return list;
  } catch {
    return seeded;
  }
}

export async function addToStringList(
  key: string,
  value: string,
  defaults: string[] = [],
  meta: ListMeta = {},
): Promise<{ list: string[]; value: string; created: boolean }> {
  const trimmed = String(value || '').trim();
  if (!trimmed) {
    const latest = await loadStringList(key, defaults, meta);
    return { list: latest, value: '', created: false };
  }

  const res = await api.post<ListItemsResponse>(
    `/configurations/${key}/list-items`,
    {
      item: trimmed,
      defaults: normalizeStringList(defaults),
      category: meta.category || 'JOBS',
      description: meta.description || key,
    },
  );

  const list = normalizeStringList(res?.data?.list ?? []);
  setCachedList(key, list);
  return {
    list,
    value: res?.data?.value || trimmed,
    created: Boolean(res?.data?.created),
  };
}

export async function mergeStringList(
  key: string,
  values: string[],
  defaults: string[] = [],
  meta: ListMeta = {},
): Promise<string[]> {
  const items = normalizeStringList(values);
  if (items.length === 0) {
    return loadStringList(key, defaults, meta);
  }

  const res = await api.post<ListItemsResponse>(
    `/configurations/${key}/list-items`,
    {
      items,
      defaults: normalizeStringList(defaults),
      category: meta.category || 'JOBS',
      description: meta.description || key,
    },
  );
  const list = normalizeStringList(res?.data?.list ?? []);
  setCachedList(key, list);
  return list;
}
