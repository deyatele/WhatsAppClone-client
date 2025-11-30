// components/ToastProvider.tsx
"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type Toast = { id: string; message: string };
const ToastContext = createContext({ addToast: (_: string) => {} });

declare global {
  interface Window {
    __TOAST_QUEUE?: string[];
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      4000,
    );
  }, []);

  // Listener for global events / queued toasts
  useEffect(() => {
    // flush any queued messages left before hydrate
    if (window.__TOAST_QUEUE?.length) {
      window.__TOAST_QUEUE.forEach((m) => {
        addToast(m);
      });
      window.__TOAST_QUEUE = [];
    }

    const handler = (e: Event) => {
      const custom = e as CustomEvent<string>;
      addToast(custom.detail);
    };
    window.addEventListener("app:toast", handler as EventListener);
    return () =>
      window.removeEventListener("app:toast", handler as EventListener);
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 space-y-2 z-50 max-w-[250px] w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="z-[1000] p-4 pl-7 bg-green-800 text-white rounded rounded-l-4xl shadow-lg 
                 break-words w-full animate-slide-in-right"
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
