import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
} from 'react';
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastTitle,
  ToastIcon,
} from '../components/ui/toast';

interface ToastData {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

interface ToastState {
  toasts: ToastData[];
}

type ToastActionType =
  | { type: 'ADD_TOAST'; payload: ToastData }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'CLEAR_TOASTS' };

const ToastContext = createContext<{
  toasts: ToastData[];
  addToast: (toast: Omit<ToastData, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
} | null>(null);

const toastReducer = (
  state: ToastState,
  action: ToastActionType
): ToastState => {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [...state.toasts, action.payload],
      };
    case 'REMOVE_TOAST':
      return {
        ...state,
        toasts: state.toasts.filter(toast => toast.id !== action.payload),
      };
    case 'CLEAR_TOASTS':
      return {
        ...state,
        toasts: [],
      };
    default:
      return state;
  }
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(toastReducer, { toasts: [] });

  const addToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };

    dispatch({ type: 'ADD_TOAST', payload: newToast });

    // 自动移除toast
    const duration = toast.duration || 5000;
    setTimeout(() => {
      dispatch({ type: 'REMOVE_TOAST', payload: id });
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_TOAST', payload: id });
  }, []);

  const clearToasts = useCallback(() => {
    dispatch({ type: 'CLEAR_TOASTS' });
  }, []);

  // 使用 useMemo 缓存 context value，避免每次 toast 变化都导致所有 consumer 重新渲染
  // 只有当 toasts 数组引用变化时才更新 value
  const contextValue = React.useMemo(
    () => ({ toasts: state.toasts, addToast, removeToast, clearToasts }),
    [state.toasts, addToast, removeToast, clearToasts]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useContext(ToastContext)!;

  return (
    <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px] pointer-events-none">
      {toasts.map((toast, index) => (
        <Toast
          key={toast.id}
          variant={toast.variant}
          className="mb-3 shadow-lg toast-enter pointer-events-auto"
          style={{
            animationDelay: `${index * 50}ms`,
          }}
        >
          <div className="flex items-start space-x-3">
            <ToastIcon variant={toast.variant} />
            <div className="flex-1 min-w-0">
              {toast.title && <ToastTitle>{toast.title}</ToastTitle>}
              {toast.description && (
                <ToastDescription>{toast.description}</ToastDescription>
              )}
            </div>
          </div>
          {toast.action && (
            <ToastAction onClick={toast.action.onClick}>
              {toast.action.label}
            </ToastAction>
          )}
          <ToastClose onClick={() => removeToast(toast.id)} />
        </Toast>
      ))}
    </div>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// 便捷的 toast 方法
export const useToastContext = () => {
  const { addToast } = useToast();

  const success = (message: string, title?: string) => {
    addToast({
      title: title || '成功',
      description: message,
      variant: 'success',
    });
  };

  const error = (message: string, title?: string) => {
    addToast({
      title: title || '错误',
      description: message,
      variant: 'destructive',
    });
  };

  const warning = (message: string, title?: string) => {
    addToast({
      title: title || '警告',
      description: message,
      variant: 'warning',
    });
  };

  const info = (message: string, title?: string) => {
    addToast({
      title: title || '提示',
      description: message,
      variant: 'default',
    });
  };

  return { success, error, warning, info };
};
