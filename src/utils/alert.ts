import { Platform, Alert as RNAlert, AlertButton } from 'react-native';
import { showToast } from '../context/ToastContext';

export function showAlert(title: string, message?: string, buttons?: AlertButton[]): void {
  if (!buttons || buttons.length === 0) {
    showToast({ title, message });
    return;
  }

  if (buttons.length === 1 && buttons[0].style !== 'cancel') {
    showToast({ title, message });
    // Chỉ auto-fire khi nút không có onPress (thuần thông báo) — không tự
    // chạy hành động như goBack trước khi người dùng đọc xong thông báo.
    if (!buttons[0].onPress) {
      setTimeout(() => buttons[0].onPress?.(), 350);
    }
    return;
  }

  if (Platform.OS === 'web') {
    const confirmMsg = message ? `${title}\n\n${message}` : title;
    const isConfirmed = window.confirm(confirmMsg);
    const confirmBtn = buttons.find(b => b.style !== 'cancel');
    const cancelBtn = buttons.find(b => b.style === 'cancel');
    if (isConfirmed && confirmBtn) {
      confirmBtn.onPress?.();
    } else if (!isConfirmed && cancelBtn) {
      cancelBtn.onPress?.();
    }
    return;
  }

  RNAlert.alert(title, message, buttons);
}

export function showConfirm(title: string, message: string, onConfirm: () => void, onCancel?: () => void): void {
  if (Platform.OS === 'web') {
    const isConfirmed = window.confirm(`${title}\n\n${message}`);
    if (isConfirmed) {
      onConfirm();
    } else {
      onCancel?.();
    }
  } else {
    RNAlert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: onCancel },
      { text: 'OK', onPress: onConfirm },
    ]);
  }
}
