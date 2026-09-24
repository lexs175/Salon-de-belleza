"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Service, StaffMember } from "@/lib/types";
import BookingWidget from "./BookingWidget";

type Props = {
  services: Service[];
  currency: string;
  hours: Record<string, string | null>;
  salonName?: string;
  staff?: StaffMember[];
};

export default function BookingModal({ services, currency, hours, salonName, staff }: Props) {
  const [open, setOpen] = useState(false);
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [promotionId, setPromotionId] = useState<number | null>(null);
  const [staffId, setStaffId] = useState<number | null>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (
        e as CustomEvent<{
          serviceId?: number | null;
          promotionId?: number | null;
          staffId?: number | null;
        }>
      ).detail;
      setServiceId(detail?.serviceId ?? null);
      setPromotionId(detail?.promotionId ?? null);
      setStaffId(detail?.staffId ?? null);
      setCount((c) => c + 1);
      setOpen(true);
    };
    window.addEventListener("salon:open-booking", onOpen);
    return () => {
      window.removeEventListener("salon:open-booking", onOpen);
    };
  }, []);

  // Bloqueo de scroll de fondo para Lenis y body
  useEffect(() => {
    if (open) {
      window.__stopLenis?.();
      window.__lenis?.stop();
      if (typeof window !== "undefined" && window.innerWidth >= 768) {
        document.body.style.overflow = "hidden";
      }
    } else {
      window.__startLenis?.();
      window.__lenis?.start();
      document.body.style.overflow = "";
    }

    return () => {
      window.__startLenis?.();
      window.__lenis?.start();
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function close() {
    setOpen(false);
  }

  if (!open) return null;

  const initial =
    serviceId !== null ? services.find((s) => s.id === serviceId) ?? null : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-lenis-prevent="true"
      className="fixed inset-0 z-50 overflow-y-auto overscroll-y-contain"
      style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}
    >
      <div
        className="fixed inset-0 bg-ink/60 backdrop-blur-sm"
        onClick={close}
      />
      <div
        data-lenis-prevent="true"
        className="relative z-10 min-h-full flex items-start sm:items-center justify-center p-2.5 sm:p-6 md:p-8 py-6 sm:py-10"
      >
        <div className="relative w-full max-w-5xl" data-lenis-prevent="true">
          <button
            onClick={close}
            aria-label="Cerrar"
            className="absolute -top-3 -right-3 z-20 bg-white rounded-[4px] p-2 shadow-lg text-stone-500 hover:text-ink transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
          <BookingWidget
            key={count}
            services={services}
            currency={currency}
            hours={hours}
            salonName={salonName}
            staff={staff}
            initialService={initial}
            initialPromotionId={promotionId}
            initialStaffId={staffId}
            onClose={close}
          />
        </div>
      </div>
    </div>
  );
}