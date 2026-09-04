import { Platform } from 'react-native';

export interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  resolve: (value: boolean) => void;
}

type ConfirmHandler = (request: ConfirmRequest) => void;

let handler: ConfirmHandler | null = null;

export function registerConfirmHandler(fn: ConfirmHandler | null) {
  handler = fn;
}

export function confirmAsync(title: string, message: string, confirmLabel: string, cancelLabel: string) {
  return new Promise<boolean>((resolve) => {
    if (Platform.OS === 'web' || !handler) {
      resolve(window.confirm(`${title}\n\n${message}`));
      return;
    }

    handler({ title, message, confirmLabel, cancelLabel, resolve });
  });
}
