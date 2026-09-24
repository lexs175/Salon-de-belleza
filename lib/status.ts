import type { Booking } from "@/lib/types";

export const STATUS_LABELS: Record<Booking["status"], string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  cancelada: "Cancelada",
  completada: "Completada",
};

export const STATUS_STYLES: Record<Booking["status"], string> = {
  pendiente: "bg-amber-100 text-amber-800",
  confirmada: "bg-green-100 text-green-800",
  cancelada: "bg-red-100 text-red-700",
  completada: "bg-sky-100 text-sky-800",
};

export const STATUS_ORDER: Booking["status"][] = [
  "pendiente",
  "confirmada",
  "cancelada",
  "completada",
];