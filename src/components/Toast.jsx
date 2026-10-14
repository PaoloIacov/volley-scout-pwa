import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { TOAST_ICONS, TOAST_STYLES } from './ui.jsx';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (message, type = 'success') => {
      const id = ++toastId;
      setToasts((current) => [...current, { id, message, type }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), 4000)
      );
    },
    [dismiss]
  );

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:top-4 sm:items-end">
        {toasts.map((toast) => {
          const Icon = TOAST_ICONS[toast.type] ?? TOAST_ICONS.info;
          return (
            <div
              key={toast.id}
              role="status"
              className={`anim-slide pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/95 px-4 py-3 text-sm text-zinc-200 shadow-2xl shadow-black/50 backdrop-blur ${TOAST_STYLES[toast.type]}`}
            >
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 ${TOAST_STYLES[toast.type]}`}>
                <Icon size={15} />
              </span>
              <p className="text-zinc-200">{toast.message}</p>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast deve essere usato dentro <ToastProvider>');
  return context;
}
