export function getPublishedYear(raw: string): string | null {
  const match = /^(\d{4})/.exec(raw);
  return match ? match[1] : null;
}
