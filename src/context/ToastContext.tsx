import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  AlertButton,
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastInput {
  title: string;
  message?: string;
  type?: ToastType;
  duration?: number;
}

interface ToastItem extends Required<ToastInput> {
  id: number;
}

interface ToastContextValue {
  showToast: (toast: ToastInput) => void;
}

const DEFAULT_DURATION = 3000;
const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let externalShowToast: ((toast: ToastInput) => void) | null = null;

const inferToastType = (title: string): ToastType => {
  const normalized = title.toLowerCase();
  if (
    normalized.includes('success') ||
    normalized.includes('sent') ||
    normalized.includes('deleted') ||
    normalized.includes('started')
  ) {
    return 'success';
  }
  if (
    normalized.includes('error') ||
    normalized.includes('failed') ||
    normalized.includes('lỗi') ||
    normalized.includes('invalid') ||
    normalized.includes('cannot')
  ) {
    return 'error';
  }
  if (normalized.includes('warning') || normalized.includes('required')) {
    return 'warning';
  }
  return 'info';
};

export const showToast = (toast: ToastInput) => {
  if (externalShowToast) {
    externalShowToast(toast);
  } else {
    Alert.alert(toast.title, toast.message);
  }
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextIdRef = useRef(1);
  const originalAlertRef = useRef(Alert.alert);

  const removeToast = useCallback((id: number) => {
    setToasts(current => current.filter(toast => toast.id !== id));
  }, []);

  const showToastInternal = useCallback(
    ({ title, message = '', type, duration = DEFAULT_DURATION }: ToastInput) => {
      const id = nextIdRef.current++;
      const toast: ToastItem = {
        id,
        title,
        message,
        duration,
        type: type || inferToastType(title),
      };

      setToasts(current => [toast, ...current].slice(0, 4));
      setTimeout(() => removeToast(id), duration);
    },
    [removeToast]
  );

  useEffect(() => {
    externalShowToast = showToastInternal;
    const originalAlert = originalAlertRef.current;

    Alert.alert = (
      title: string,
      message?: string,
      buttons?: AlertButton[],
      options?: any
    ) => {
      if (buttons && buttons.length === 1 && buttons[0].style !== 'cancel') {
        showToastInternal({ title, message });
        // Chỉ auto-fire khi nút thuần thông báo (không có onPress).
        // Nút có hành động (vd: goBack) để người dùng tự bấm sau khi đọc toast,
        // tránh việc app tự điều hướng trước khi đọc thông báo.
        if (!buttons[0].onPress) {
          setTimeout(() => buttons[0].onPress?.(), 350);
        }
        return;
      }

      if (buttons && buttons.length > 0) {
        originalAlert(title, message, buttons, options);
        return;
      }

      showToastInternal({ title, message });
    };

    return () => {
      externalShowToast = null;
      Alert.alert = originalAlert;
    };
  }, [showToastInternal]);

  const value = useMemo(
    () => ({ showToast: showToastInternal }),
    [showToastInternal]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View pointerEvents="box-none" style={styles.host}>
        {toasts.map(toast => (
          <ToastCard
            key={toast.id}
            toast={toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
};

const ToastCard: React.FC<{
  toast: ToastItem;
  onClose: () => void;
}> = ({ toast, onClose }) => {
  const translateY = useRef(new Animated.Value(-16)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const config = TOAST_CONFIG[toast.type];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  return (
    <Animated.View
      pointerEvents="auto"
      style={[
        styles.toast,
        { borderLeftColor: config.color, opacity, transform: [{ translateY }] },
      ]}>
      <View style={[styles.iconWrap, { backgroundColor: config.bg }]}>
        <Icon name={config.icon} size={18} color={config.color} />
      </View>
      <View style={styles.textWrap}>
        <Text numberOfLines={1} style={styles.title}>
          {toast.title}
        </Text>
        {!!toast.message && (
          <Text numberOfLines={2} style={styles.message}>
            {toast.message}
          </Text>
        )}
      </View>
      <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
        <Icon name="close" size={16} color="#64748b" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const TOAST_CONFIG: Record<
  ToastType,
  { color: string; bg: string; icon: string }
> = {
  success: { color: '#059669', bg: '#ecfdf5', icon: 'check-circle' },
  error: { color: '#dc2626', bg: '#fef2f2', icon: 'error' },
  warning: { color: '#d97706', bg: '#fffbeb', icon: 'warning' },
  info: { color: '#2563eb', bg: '#eff6ff', icon: 'info' },
};

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 24 : 48,
    right: Platform.OS === 'web' ? 24 : 12,
    left: Platform.OS === 'web' ? undefined : 12,
    zIndex: 9999,
    elevation: 9999,
    alignItems: Platform.OS === 'web' ? 'flex-end' : 'stretch',
  },
  toast: {
    width: Platform.OS === 'web' ? 360 : '100%',
    maxWidth: '100%',
    minHeight: 64,
    marginBottom: 10,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 8,
    borderRadius: 12,
    borderLeftWidth: 4,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '800',
  },
  message: {
    color: '#64748b',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
});
