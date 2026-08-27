import { Alert, Platform } from 'react-native';

export function confirmAsync(title: string, message: string, confirmLabel: string, cancelLabel: string) {
  return new Promise<boolean>((resolve) => {
    if (Platform.OS === 'web') {
      resolve(window.confirm(`${title}\n\n${message}`));
      return;
    }

    Alert.alert(title, message, [
      { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}
