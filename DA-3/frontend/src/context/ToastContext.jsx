import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type, message, title = '') => {
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newToast = { id, type, message, title };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, 4000);

    return id;
  }, [removeToast]);

  const toast = {
    success: (msg, title = 'Success') => addToast('success', msg, title),
    error: (msg, title = 'Error') => addToast('error', msg, title),
    info: (msg, title = 'Note') => addToast('info', msg, title),
    warning: (msg, title = 'Warning') => addToast('warning', msg, title),
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} color="var(--green-accent)" />;
      case 'error':
        return <AlertCircle size={18} color="var(--red-accent)" />;
      case 'warning':
        return <AlertTriangle size={18} color="var(--gold-accent)" />;
      default:
        return <Info size={18} color="var(--blue-primary)" />;
    }
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Floating Viewport */}
      {toasts.length > 0 && (
        <div className="toast-container" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className={`toast-item toast-${t.type}`} role="status">
              <div className="toast-icon">{getIcon(t.type)}</div>
              <div className="toast-content">
                {t.title && <div className="toast-title">{t.title}</div>}
                <div className="toast-message">{t.message}</div>
              </div>
              <button
                className="toast-close-btn"
                onClick={() => removeToast(t.id)}
                aria-label="Dismiss notification"
              >
                <X size={14} />
              </button>
              <div className="toast-progress" style={{ animationDuration: '4000ms' }} />
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
