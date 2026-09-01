/**
 * Load every page of a paginated API response.
 * `fetchPage(page, pageSize)` must return `{ [itemsKey]: T[], pagination?: { totalPages } }`.
 */
export async function fetchAllPages(fetchPage, itemsKey, pageSize = 100) {
  const first = await fetchPage(1, pageSize);
  const items = [...(first?.[itemsKey] || [])];
  const totalPages = first?.pagination?.totalPages || 1;

  for (let page = 2; page <= totalPages; page += 1) {
    const next = await fetchPage(page, pageSize);
    items.push(...(next?.[itemsKey] || []));
  }

  return items;
}
