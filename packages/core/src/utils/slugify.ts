/**
 * ASCII slug helper for resource IDs.
 *
 * Implemented locally so published CommonJS chunks never static-import the
 * ESM-only `@sindresorhus/slugify` package (see #22609).
 */
export function slugify(input: string): string {
  if (!input) return '';

  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
