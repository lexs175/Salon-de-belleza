"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import type { ToastType } from "./toast";

type Toast = { id: number; message: string; type: ToastType };

const STYLES: Record<ToastType, { box: string; icon: React.ReactNode }> = {
  success: {
    box: "bg-accent-deep text-white",
    icon: <CheckCircle2 size={18} className="shrink-0" />,
  },
  error: {
    box: "bg-red-700 text-white",
    icon: <XCircle size={18} className="shrink-0" />,
  },
  info: {
    box: "bg-ink text-white",
    icon: <Info size={18} className="shrink-0" />,
  },
};

export default function Toasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const onToast = (e: Event) => {
      const detail = (e as CustomEvent<{ message: string; type: ToastType }>).detail;
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, message: detail.message, type: detail.type }]);
      setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id));
      }, 5000);
    };
    window.addEventListener("salon:toast", onToast);
    return () => window.removeEventListener("salon:toast", onToast);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-10 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm items-center">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 rounded-[4px] px-4 py-3 shadow-lg ${STYLES[t.type].box}`}
        >
          {STYLES[t.type].icon}
          <p className="text-sm font-medium flex-1">{t.message}</p>
          <button
            onClick={() => setToasts((list) => list.filter((x) => x.id !== t.id))}
            aria-label="Cerrar notificación"
            className="opacity-70 hover:opacity-100 transition-opacity"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}