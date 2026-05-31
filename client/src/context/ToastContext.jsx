import { createContext, useContext, useCallback, useState } from 'react';

const ToastContext = createContext(null);

let idSeq = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (toast) => {
      const id = ++idSeq;
      setToasts((list) => [...list, { id, ...toast }]);
      setTimeout(() => dismiss(id), toast.duration || 3800);
    },
    [dismiss]
  );

  const toast = {
    success: (title, msg) => push({ type: 'success', title, msg, icon: '✅' }),
    error: (title, msg) => push({ type: 'error', title, msg, icon: '⚠️' }),
    info: (title, msg) => push({ type: 'info', title, msg, icon: 'ℹ️' }),
    celebrate: (title, msg) => push({ type: 'success', title, msg, icon: '🎉', duration: 5000 }),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`} onClick={() => dismiss(t.id)}>
            <span style={{ fontSize: 18 }}>{t.icon}</span>
            <div>
              <div className="toast-title">{t.title}</div>
              {t.msg && <div className="toast-msg">{t.msg}</div>}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
