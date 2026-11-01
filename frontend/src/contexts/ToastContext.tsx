import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3.5 rounded border-2 border-[#111111] shadow-[4px_4px_0_#FF4D5A] transition-all ${
              t.type === "success"
                ? "bg-obsidian-900 text-emerald-200"
                : t.type === "error"
                ? "bg-obsidian-900 text-rose-200"
                : "bg-obsidian-900 text-amber-200"
            }`}
          >
            {t.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
            {t.type === "error" && <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
            {t.type === "info" && <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
            <span className="text-sm font-medium flex-1 leading-snug">{t.message}</span>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              aria-label="Fechar notificação"
              className="text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast deve ser usado dentro de um ToastProvider");
  return ctx;
}
