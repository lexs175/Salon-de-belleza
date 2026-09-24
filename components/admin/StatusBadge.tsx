"use client";

import { STATUS_LABELS, STATUS_STYLES } from "@/lib/status";
import type { Booking } from "@/lib/types";

export default function StatusBadge({ status }: { status: Booking["status"] }) {
  return (
    <span
      className={`inline-block rounded-[4px] px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}