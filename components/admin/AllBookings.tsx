"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Loader2, RefreshCw, Search, Trash2 } from "lucide-react";
import { STATUS_ORDER } from "@/lib/status";
import { waBookingMessage, waLink } from "@/lib/format";
import { showToast } from "./toast";
import type { Booking, StaffMember } from "@/lib/types";
import ManageBookingModal from "./ManageBookingModal";

const MONTH_NAMES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

function dateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

export default function AllBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("todas");
  const [query, setQuery] = useState("");
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [managingBooking, setManagingBooking] = useState<Booking | null>(null);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/bookings");
    const data = (await res.json()) as { bookings: Booking[] };
    setBookings(data.bookings);
    setLoading(false);
  };

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/admin/bookings").then((r) => r.json()),
      fetch("/api/admin/staff").then((r) => r.json()).catch(() => ({ staff: [] })),
    ])
      .then(([bookingsData, staffData]) => {
        if (active) {
          setBookings(bookingsData.bookings || []);
          setStaffList(staffData.staff || []);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function setStatus(id: number, status: string) {
    await fetch(`/api/admin/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function remove(id: number) {
    await fetch(`/api/admin/bookings/${id}`, { method: "DELETE" });
    setRemovingId(null);
    load();
    showToast("Reserva eliminada", "success");
  }

  const q = query.trim().toLowerCase();
  const shown = bookings.filter(
    (b) =>
      (filter === "todas" || b.status === filter) &&
      (!q ||
        b.name.toLowerCase().includes(q) ||
        b.phone.toLowerCase().includes(q) ||
        b.service_name?.toLowerCase().includes(q) ||
        b.date.includes(q))
  );

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl text-stone-900">Todas las reservas</h1>

      <div className="flex items-center gap-3">
        <div className="flex items-stretch flex-1 max-w-sm rounded-[4px] border border-stone-200 bg-white focus-within:border-stone-900 focus-within:ring-1 focus-within:ring-stone-900/10 transition-all overflow-hidden shadow-2xs">
          <span className="flex items-center px-3 bg-stone-100/90 border-r border-stone-200 text-stone-400 select-none shrink-0">
            <Search size={14} />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, teléfono o servicio…"
            className="w-full bg-transparent px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter("todas")}
          className={`rounded-[4px] px-4 py-2 text-sm transition-colors ${
            filter === "todas"
              ? "bg-brand text-ink"
              : "bg-white border border-stone-200 text-stone-600 hover:border-rose-300"
          }`}
        >
          Todas ({bookings.length})
        </button>
        {STATUS_ORDER.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-[4px] px-4 py-2 text-sm transition-colors ${
              filter === s
                ? "bg-brand text-ink"
                : "bg-white border border-stone-200 text-stone-600 hover:border-rose-300"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)} (
            {bookings.filter((b) => b.status === s).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-rose-700" />
        </div>
      ) : shown.length === 0 ? (
        <p className="text-stone-500 bg-white border border-dashed border-stone-300 rounded-[4px] px-6 py-10 text-center">
          No hay reservas con este filtro.
        </p>
      ) : (
        <div className="bg-white rounded-[4px] border border-stone-200 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-stone-500 border-b border-stone-200">
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Hora</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Servicio</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((b) => (
                <tr key={b.id} className="border-b border-stone-100 last:border-0">
                  <td className="px-4 py-3 whitespace-nowrap text-stone-700">{dateLabel(b.date)}</td>
                  <td className="px-4 py-3 whitespace-nowrap font-medium text-accent">{b.time}</td>
                  <td className="px-4 py-3">
                    <p className="text-stone-900">{b.name}</p>
                    <p className="text-xs text-stone-500">{b.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {b.service_name}
                    {b.notes && (
                      <p className="text-xs italic text-stone-500 max-w-[220px] truncate">
                        “{b.notes}”
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={b.status}
                      onChange={(e) => setStatus(b.id, e.target.value)}
                      className="border border-stone-200 rounded-[4px] px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
                    >
                      {STATUS_ORDER.map((s) => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setManagingBooking(b)}
                        title="Reagendar o Cancelar con WhatsApp"
                        className="inline-flex items-center gap-1.5 rounded-[4px] bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold px-3 py-1.5 transition-colors cursor-pointer"
                      >
                        <RefreshCw size={12} className="text-rose-500" />
                        <span>Gestionar</span>
                      </button>

                      {b.phone && (
                        <a
                          href={waLink(b.phone, waBookingMessage(b))}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-[4px] bg-accent hover:bg-accent-deep text-white text-xs font-medium px-3 py-1.5 transition-colors"
                        >
                          <Image
                            src="/logos/logo-whatsapp.svg"
                            alt=""
                            width={13}
                            height={13}
                            className="shrink-0"
                          />
                          WhatsApp
                        </a>
                      )}
                      {removingId === b.id ? (
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <button
                            onClick={() => remove(b.id)}
                            className="text-xs font-medium text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-[4px] transition-colors"
                          >
                            Sí, eliminar
                          </button>
                          <button
                            onClick={() => setRemovingId(null)}
                            className="text-xs font-medium text-stone-600 hover:text-stone-900 px-2 py-1.5 rounded-[4px] transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setRemovingId(removingId === b.id ? null : b.id)}
                          aria-label="Eliminar"
                          className="text-stone-500 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {managingBooking && (
        <ManageBookingModal
          booking={managingBooking}
          staffList={staffList}
          onClose={() => setManagingBooking(null)}
          onSuccess={() => {
            load();
            setManagingBooking(null);
          }}
        />
      )}
    </div>
  );
}