import { api } from './http';

/** Fetch every page for selectors; never silently hide records after the first page. */
export async function fetchAllPages<T>(path: string, key: string): Promise<T[]> {
  const records: T[] = [];
  for (let page = 1; ; page += 1) {
    const response = await api.get<Record<string, unknown> & { pagination?: { pages?: number; totalPages?: number; total?: number } }>(`${path}${path.includes('?') ? '&' : '?'}page=${page}&limit=100`);
    const rows = response[key];
    if (!Array.isArray(rows)) throw new Error(`Invalid ${key} response`);
    records.push(...rows);
    if (!response.pagination) break;
    const pages = response.pagination?.pages ?? response.pagination?.totalPages;
    if (pages != null ? page >= pages : rows.length < 100) break;
    if (rows.length === 0) break;
  }
  return records;
}
