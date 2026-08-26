import { randomUUID } from 'expo-crypto';
import { File, Paths } from 'expo-file-system';

// Image picker results live in a cache/temp location that the OS can purge
// at any time — copy the file into the app's persistent document directory
// so a manually-added cover survives restarts and low-storage cleanups.
export function persistLocalImage(sourceUri: string): string {
  const extension = sourceUri.split('.').pop()?.split('?')[0] || 'jpg';
  const destination = new File(Paths.document, `cover-${randomUUID()}.${extension}`);
  const source = new File(sourceUri);
  source.copy(destination);
  return destination.uri;
}

// Best-effort cleanup when a manually-added book's cover is replaced —
// avoids orphaned files piling up in the document directory. Safe to call
// with any URI; failures (e.g. already gone) are silently ignored.
export function deleteLocalImage(uri: string): void {
  try {
    new File(uri).delete();
  } catch {
    // ignore — not worth surfacing a failure to clean up an old file
  }
}
