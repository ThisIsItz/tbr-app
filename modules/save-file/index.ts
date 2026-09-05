import { requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

interface SaveFileNativeModule {
  saveFileAsync(filename: string, mimeType: string, contents: string): Promise<boolean>;
}

/**
 * Opens Android's native "Save as" dialog (Storage Access Framework create-document intent),
 * letting the user pick any location — including Downloads — for a single file.
 * Resolves to `false` if the user cancels. Android only.
 */
export async function saveFileAsync(
  filename: string,
  mimeType: string,
  contents: string,
): Promise<boolean> {
  if (Platform.OS !== 'android') {
    throw new Error('saveFileAsync is only available on Android');
  }
  const native = requireNativeModule<SaveFileNativeModule>('SaveFile');
  return native.saveFileAsync(filename, mimeType, contents);
}
