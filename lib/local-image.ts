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
