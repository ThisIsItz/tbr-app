import { Platform } from 'react-native';

export interface DialogButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

export interface DialogRequest {
  title: string;
  message?: string;
  buttons: DialogButton[];
}

type DialogHandler = (request: DialogRequest) => void;

let handler: DialogHandler | null = null;

export function registerDialogHandler(fn: DialogHandler | null) {
  handler = fn;
}

export function showDialog(title: string, message?: string, buttons: DialogButton[] = [{ text: 'OK' }]) {
  if (Platform.OS === 'web' || !handler) {
    if (buttons.length > 1) {
      const confirmed = window.confirm(message ? `${title}\n\n${message}` : title);
      const pressed = buttons.find((b) => (confirmed ? b.style !== 'cancel' : b.style === 'cancel'));
      pressed?.onPress?.();
    } else {
      window.alert(message ? `${title}\n\n${message}` : title);
      buttons[0]?.onPress?.();
    }
    return;
  }

  handler({ title, message, buttons });
}

export function showAlert(title: string, message: string | undefined, okLabel: string) {
  showDialog(title, message, [{ text: okLabel, style: 'default' }]);
}

export function confirmAsync(title: string, message: string, confirmLabel: string, cancelLabel: string) {
  return new Promise<boolean>((resolve) => {
    showDialog(title, message, [
      { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}
