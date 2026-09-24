"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpDown,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  History,
  Loader2,
  MessageCircle,
  Phone,
  Search,
  Sparkles,
  User,
  Users,
  X,
} from "lucide-react";
import type { Booking, ClientContact } from "@/lib/types";
import { formatPrice, waLink } from "@/lib/format";
import Button, { buttonClasses } from "@/components/ui/Button";
import StatusBadge from "./StatusBadge";

type FilterType = "all" | "recurrent" | "new" | "inactive";

export default function ContactsAdmin({ currency }: { currency: string }) {
  const [contacts, setContacts] = useState<ClientContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedContact, setSelectedContact] = useState<ClientContact | null>(null);

  useEffect(() => {
    fetch("/api/admin/contacts")
      .then((r) => r.json())
      .then((data: { contacts: ClientContact[] }) => {
        setContacts(data.contacts || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Filtrado y búsqueda
  const filteredContacts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

    return contacts.filter((c) => {
      // Búsqueda
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.favorite_service.toLowerCase().includes(q);

      if (!matchSearch) return false;

      // Filtro
      if (filter === "recurrent") return c.total_bookings >= 2;
      if (filter === "new") return c.total_bookings === 1;
      if (filter === "inactive") return c.last_visit && c.last_visit < thirtyDaysAgoStr;
      return true;
    });
  }, [contacts, search, filter]);

  // Exportar a CSV para WhatsApp / Excel
  function exportCSV() {
    if (contacts.length === 0) return;
    const headers = [
      "Nombre",
      "WhatsApp / Teléfono",
      "Total Citas",
      "Citas Realizadas",
      "Citas Canceladas",
      "Total Invertido",
      "Última Visita",
      "Primera Visita",
      "Servicio Favorito",
    ];

    const rows = contacts.map((c) => [
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.phone}"`,
      c.total_bookings,
      c.completed_bookings,
      c.cancelled_bookings,
      c.total_spent,
      c.last_visit,
      c.first_visit,
      `"${c.favorite_service.replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `contactos-clientes-${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Métricas generales
  const totalRevenue = useMemo(
    () => contacts.reduce((sum, c) => sum + c.total_spent, 0),
    [contacts]
  );
  const recurrentCount = useMemo(
    () => contacts.filter((c) => c.total_bookings >= 2).length,
    [contacts]
  );

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-stone-900">Directorio de Contactos</h1>
          <p className="text-sm text-stone-500 mt-1">
            Clientes registrados automáticamente con su WhatsApp, historial de citas y gasto total.
          </p>
        </div>

        <button
          onClick={exportCSV}
          disabled={contacts.length === 0}
          className={buttonClasses("dark", "md", "gap-2 self-start sm:self-auto")}
        >
          <Download size={15} />
          <span>Exportar CSV / Excel</span>
        </button>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white rounded-[4px] border border-stone-200 p-4 shadow-xs">
          <p className="text-xs font-mono uppercase text-stone-400">Total Contactos</p>
          <p className="font-serif text-2xl text-stone-900 font-bold mt-1">{contacts.length}</p>
          <p className="text-xs text-stone-500 mt-0.5">Números únicos registrados</p>
        </div>

        <div className="bg-white rounded-[4px] border border-stone-200 p-4 shadow-xs">
          <p className="text-xs font-mono uppercase text-stone-400">Clientes Frecuentes</p>
          <p className="font-serif text-2xl text-emerald-800 font-bold mt-1">{recurrentCount}</p>
          <p className="text-xs text-stone-500 mt-0.5">
            {contacts.length > 0
              ? `${Math.round((recurrentCount / contacts.length) * 100)}% de fidelidad`
              : "Con 2 o más citas"}
          </p>
        </div>

        <div className="bg-white rounded-[4px] border border-stone-200 p-4 shadow-xs">
          <p className="text-xs font-mono uppercase text-stone-400">Facturación Generada</p>
          <p className="font-serif text-2xl text-stone-900 font-bold mt-1">
            {formatPrice(currency, totalRevenue)}
          </p>
          <p className="text-xs text-stone-500 mt-0.5">Total invertido por todos los clientes</p>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-stretch flex-1 max-w-md rounded-[4px] border border-stone-300 bg-white focus-within:border-stone-900 focus-within:ring-1 focus-within:ring-stone-900/10 transition-all overflow-hidden shadow-2xs">
          <span className="flex items-center px-3 bg-stone-100/90 border-r border-stone-200 text-stone-400 select-none shrink-0">
            <Search size={14} />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, número de WhatsApp o servicio..."
            className="w-full bg-transparent px-3.5 py-2.5 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="px-3 text-stone-400 hover:text-stone-700 cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[
            { id: "all", label: `Todos (${contacts.length})` },
            { id: "recurrent", label: `Frecuentes (${recurrentCount})` },
            { id: "new", label: `Nuevos (${contacts.length - recurrentCount})` },
            { id: "inactive", label: "Inactivos (+30d)" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as FilterType)}
              className={`px-3 py-1.5 rounded-[4px] text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                filter === tab.id
                  ? "bg-stone-950 text-white"
                  : "bg-white text-stone-600 border border-stone-200 hover:border-stone-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Listado de Contactos */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-stone-700" size={28} />
        </div>
      ) : filteredContacts.length === 0 ? (
        <div className="bg-white rounded-[4px] border border-stone-200 p-10 text-center">
          <Users size={32} className="mx-auto text-stone-300 mb-2" />
          <p className="text-stone-700 font-medium">No se encontraron contactos</p>
          <p className="text-stone-400 text-xs mt-1">
            {search
              ? "Prueba cambiando los términos de búsqueda."
              : "Los contactos aparecerán automáticamente cuando los clientes agenden citas."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-[4px] border border-stone-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">WhatsApp</th>
                  <th className="py-3 px-4">Citas</th>
                  <th className="py-3 px-4">Inversión</th>
                  <th className="py-3 px-4">Última Cita</th>
                  <th className="py-3 px-4">Servicio Preferido</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredContacts.map((c) => {
                  const initials = c.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();
                  const waGreeting = `Hola ${c.name.split(" ")[0]}, te saludamos de Beauty Palace. ¿Cómo estás? Nos encantaría saber si te gustaría agendar tu próxima cita.`;

                  return (
                    <tr
                      key={c.phone}
                      className="hover:bg-stone-50/70 transition-colors cursor-pointer"
                      onClick={() => setSelectedContact(c)}
                    >
                      {/* Cliente */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-[4px] bg-stone-900 text-white font-serif font-bold text-xs flex items-center justify-center shrink-0">
                            {initials || "C"}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-stone-900 truncate">{c.name}</p>
                            <p className="text-[11px] text-stone-400 font-mono">
                              Cliente desde {c.first_visit}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* WhatsApp */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <a
                          href={waLink(c.phone, waGreeting)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 font-mono text-emerald-800 hover:text-emerald-950 font-semibold bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-[4px] transition-colors"
                          title="Abrir chat de WhatsApp"
                        >
                          <MessageCircle size={13} className="text-emerald-700" />
                          <span>{c.phone}</span>
                        </a>
                      </td>

                      {/* Citas */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-medium text-stone-800">
                          {c.total_bookings} {c.total_bookings === 1 ? "cita" : "citas"}
                        </span>
                        {c.cancelled_bookings > 0 && (
                          <span className="text-[10px] text-stone-400 ml-1">
                            ({c.cancelled_bookings} canc.)
                          </span>
                        )}
                      </td>

                      {/* Inversión */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-stone-900">
                          {formatPrice(currency, c.total_spent)}
                        </span>
                      </td>

                      {/* Última Visita */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-stone-700">{c.last_visit}</span>
                      </td>

                      {/* Servicio Preferido */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block max-w-[160px] truncate text-stone-600 bg-stone-100 px-2 py-0.5 rounded-[4px] border border-stone-200">
                          {c.favorite_service}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={waLink(c.phone, waGreeting)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-[4px] border border-emerald-200 transition-colors inline-flex items-center gap-1"
                          >
                            <MessageCircle size={12} />
                            <span>WhatsApp</span>
                          </a>

                          <button
                            onClick={() => setSelectedContact(c)}
                            className="text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-2.5 py-1.5 rounded-[4px] border border-stone-200 transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <History size={12} />
                            <span>Historial</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Detalle / Historial del Cliente */}
      {selectedContact && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="bg-white rounded-[4px] w-full max-w-2xl p-6 sm:p-8 shadow-2xl my-8 border border-stone-200 space-y-5">
            {/* Cabecera del Modal */}
            <div className="flex items-start justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-[4px] bg-stone-950 text-white font-serif font-bold text-base flex items-center justify-center shrink-0">
                  {selectedContact.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase() || "C"}
                </div>
                <div>
                  <h2 className="font-serif text-xl text-stone-900 font-bold">
                    {selectedContact.name}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-xs text-stone-600">
                      {selectedContact.phone}
                    </span>
                    <span>·</span>
                    <span className="text-xs text-stone-400">
                      Registrado: {selectedContact.first_visit}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedContact(null)}
                aria-label="Cerrar"
                className="text-stone-400 hover:text-stone-800 p-1 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Resumen del cliente */}
            <div className="grid grid-cols-3 gap-3 bg-stone-50 border border-stone-200 rounded-[4px] p-3 text-center text-xs">
              <div>
                <p className="text-stone-400 uppercase font-mono text-[10px]">Citas Totales</p>
                <p className="font-bold text-stone-900 text-base font-mono mt-0.5">
                  {selectedContact.total_bookings}
                </p>
              </div>
              <div>
                <p className="text-stone-400 uppercase font-mono text-[10px]">Total Invertido</p>
                <p className="font-bold text-stone-900 text-base font-mono mt-0.5">
                  {formatPrice(currency, selectedContact.total_spent)}
                </p>
              </div>
              <div>
                <p className="text-stone-400 uppercase font-mono text-[10px]">Última Visita</p>
                <p className="font-bold text-stone-900 text-sm font-mono mt-0.5">
                  {selectedContact.last_visit}
                </p>
              </div>
            </div>

            {/* Plantillas de WhatsApp directas */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-stone-800 uppercase tracking-wider">
                Escribir por WhatsApp rápido:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <a
                  href={waLink(
                    selectedContact.phone,
                    `Hola ${selectedContact.name.split(" ")[0]}, te escribimos de Beauty Palace. ¿Cómo estás? Te extrañamos en el salón y nos encantaría saber si deseas agendar tu próximo servicio.`
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 p-2.5 rounded-[4px] border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 text-emerald-950 text-xs font-medium transition-colors"
                >
                  <MessageCircle size={15} className="text-emerald-700 shrink-0" />
                  <span className="truncate">"Te extrañamos en el salón..."</span>
                </a>

                <a
                  href={waLink(
                    selectedContact.phone,
                    `Hola ${selectedContact.name.split(" ")[0]}, te compartimos nuestras promociones exclusivas en Beauty Palace para esta semana. ¡Reserva tu lugar antes de que se agoten los cupos!`
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 p-2.5 rounded-[4px] border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 text-emerald-950 text-xs font-medium transition-colors"
                >
                  <Sparkles size={15} className="text-emerald-700 shrink-0" />
                  <span className="truncate">Enviar promoción exclusiva</span>
                </a>
              </div>
            </div>

            {/* Historial de Citas */}
            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-stone-800 uppercase tracking-wider">
                Historial de Reservas ({selectedContact.bookings.length})
              </p>

              <div className="max-h-[260px] overflow-y-auto divide-y divide-stone-100 border border-stone-200 rounded-[4px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {selectedContact.bookings.map((b) => (
                  <div key={b.id} className="p-3 hover:bg-stone-50 transition-colors flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-stone-900">{b.service_name}</p>
                      <p className="text-stone-500 text-[11px] font-mono mt-0.5">
                        {b.date} · {b.time} {b.staff_name ? `con ${b.staff_name}` : ""}
                      </p>
                      {b.discount_applied && b.discount_applied > 0 ? (
                        <p className="text-[10px] text-emerald-700 font-mono mt-0.5">
                          Descuento aplicado: {formatPrice(currency, b.discount_applied)}
                        </p>
                      ) : null}
                    </div>

                    <div className="text-right shrink-0 space-y-1">
                      <StatusBadge status={b.status} />
                      <p className="font-mono font-semibold text-stone-800">
                        {formatPrice(currency, (b.service_price ?? 0) - (b.discount_applied ?? 0))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedContact(null)}
                className={buttonClasses("dark", "md")}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
