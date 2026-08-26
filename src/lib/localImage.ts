import { randomUUID } from 'expo-crypto';
import { File, Paths } from 'expo-file-system';

// Copies the picker's temp file into the persistent document directory so it survives restarts.
export function persistLocalImage(sourceUri: string): string {
  const extension = sourceUri.split('.').pop()?.split('?')[0] || 'jpg';
  const destination = new File(Paths.document, `cover-${randomUUID()}.${extension}`);
  const source = new File(sourceUri);
  source.copy(destination);
  return destination.uri;
}

export function deleteLocalImage(uri: string): void {
  try {
    new File(uri).delete();
  } catch {
    // best-effort cleanup, safe to ignore
  }
}
