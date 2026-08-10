import { api } from './http';

interface ConfigResponse {
  success?: boolean;
  data?: { key: string; value: string; type: string };
}

export const GOODS_TYPES_CONFIG_KEY = 'GOODS_TYPES';
export const VESSEL_NAMES_CONFIG_KEY = 'VESSEL_NAMES';
export const SHIPPING_LINES_CONFIG_KEY = 'SHIPPING_LINES';
export const TERMINAL_NAMES_CONFIG_KEY = 'TERMINAL_NAMES';

export type ListMeta = {
  category?: string;
  description?: string;
};

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
  await api.post('/configurations', {
    key,
    value: JSON.stringify(normalizeStringList(list)),
    type: 'JSON',
    category: meta.category || 'JOBS',
    description: meta.description || key,
  });
}

/**
 * Load a JSON string-list config. Seeds defaults when missing.
 * On network errors returns defaults for UI only (does not overwrite DB).
 */
export async function loadStringList(
  key: string,
  defaults: string[],
  meta: ListMeta = {},
): Promise<string[]> {
  try {
    const stored = await fetchStoredList(key);
    if (stored && stored.length > 0) return stored;

    const seeded = normalizeStringList(defaults);
    if (seeded.length > 0) {
      try {
        await saveStringList(key, seeded, meta);
      } catch {
        // still return defaults for UI
      }
    }
    return seeded;
  } catch {
    return normalizeStringList(defaults);
  }
}

export async function addToStringList(
  key: string,
  value: string,
  defaults: string[] = [],
  meta: ListMeta = {},
): Promise<{ list: string[]; value: string; created: boolean }> {
  let latest: string[];
  try {
    const stored = await fetchStoredList(key);
    latest =
      stored && stored.length > 0
        ? stored
        : normalizeStringList(defaults);
  } catch (error: any) {
    if (error?.status === 404) {
      latest = normalizeStringList(defaults);
    } else {
      throw error;
    }
  }

  const trimmed = String(value || '').trim();
  if (!trimmed) {
    return { list: latest, value: '', created: false };
  }

  const existing = latest.find(
    (t) => t.toLowerCase() === trimmed.toLowerCase(),
  );
  if (existing) {
    return { list: latest, value: existing, created: false };
  }

  const updated = normalizeStringList([...latest, trimmed]);
  await saveStringList(key, updated, meta);
  return { list: updated, value: trimmed, created: true };
}
