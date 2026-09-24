"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  BookUser,
  ExternalLink,
  LayoutDashboard,
  List,
  LogOut,
  Megaphone,
  Menu,
  Settings,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import type { Booking } from "@/lib/types";
import { showToast } from "./toast";

const MAIN_LINKS = [
  { href: "/admin", label: "Agenda", icon: LayoutDashboard },
  { href: "/admin/bookings", label: "Reservas", icon: List },
  { href: "/admin/contacts", label: "Contactos", icon: BookUser },
  { href: "/admin/services", label: "Servicios", icon: Sparkles },
  { href: "/admin/team", label: "Equipo", icon: Users },
  { href: "/admin/promotions", label: "Promociones", icon: Megaphone },
  { href: "/admin/ingresos", label: "Ingresos", icon: BarChart3 },
];

export default function AdminNav({ salonName }: { salonName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, setPending] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const knownIds = useRef<Set<number> | null>(null);

  // Cerrar el drawer al cambiar de ruta
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Bloquear scroll de la página cuando el drawer móvil esté abierto
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Cerrar drawer al presionar Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Polling de reservas pendientes y notificaciones toast
  useEffect(() => {
    let active = true;
    const load = () => {
      fetch("/api/admin/bookings")
        .then((r) => r.json())
        .then((data: { bookings: Booking[] }) => {
          if (!active) return;
          const bookings = data.bookings;
          setPending(bookings.filter((b) => b.status === "pendiente").length);
          if (knownIds.current === null) {
            knownIds.current = new Set(bookings.map((b) => b.id));
            return;
          }
          const fresh = bookings.filter(
            (b) => b.status === "pendiente" && !knownIds.current!.has(b.id)
          );
          for (const b of fresh) {
            showToast(
              `Nueva reserva de ${b.name} · ${b.service_name} el ${b.date} a las ${b.time}`,
              "success"
            );
          }
          knownIds.current = new Set(bookings.map((b) => b.id));
        })
        .catch(() => {});
    };
    load();
    const id = setInterval(load, 30000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  // Componente reutilizable para los ítems del menú de navegación
  const NavLinksList = () => (
    <div className="space-y-6">
      <div>
        <p className="px-3 text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-2">
          Gestión
        </p>
        <div className="space-y-1">
          {MAIN_LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-[4px] text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand text-ink shadow-xs"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <l.icon size={18} className={active ? "text-ink" : "text-stone-500"} />
                  <span>{l.label}</span>
                </div>
                {l.href === "/admin" && pending !== null && pending > 0 && (
                  <span className="bg-amber-400 text-amber-950 text-[11px] font-bold rounded-[4px] min-w-[20px] h-5 px-1.5 flex items-center justify-center">
                    {pending}
                  </span>
                )}
                {l.href === "/admin/bookings" && pending !== null && pending > 0 && (
                  <span className="bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-semibold rounded-[4px] min-w-[20px] h-5 px-1.5 flex items-center justify-center">
                    {pending}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      <div>
        <p className="px-3 text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-2">
          Sistema
        </p>
        <div className="space-y-1">
          <Link
            href="/admin/settings"
            onClick={() => setMenuOpen(false)}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-[4px] text-sm font-medium transition-colors ${
              pathname === "/admin/settings"
                ? "bg-brand text-ink shadow-xs"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
            }`}
          >
            <Settings size={18} className={pathname === "/admin/settings" ? "text-ink" : "text-stone-500"} />
            <span>Configuración</span>
          </Link>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-[4px] text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <ExternalLink size={18} className="text-stone-500" />
              <span>Ver sitio web</span>
            </div>
            <span className="text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded-[4px]">Público</span>
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ========================================================= */}
      {/* 1. TOPBAR PARA MOBILE Y TABLET (< lg)                      */}
      {/* ========================================================= */}
      <header className="lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menú de administración"
              className="flex items-center justify-center h-10 w-10 rounded-[4px] text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors"
            >
              <Menu size={22} />
            </button>
            <Link href="/admin" className="flex items-center gap-2.5 min-w-0">
              <Image
                src="/logos/logo-black.svg"
                alt="Joy Joy"
                width={70}
                height={18}
                className="h-4.5 w-auto shrink-0"
              />
              <span className="text-xs font-medium text-stone-500 truncate border-l border-stone-200 pl-2">
                Panel
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {pending !== null && pending > 0 && (
              <Link
                href="/admin/bookings"
                className="flex items-center gap-1.5 bg-amber-50 text-amber-900 border border-amber-200 text-xs font-medium px-2.5 py-1 rounded-[4px] hover:bg-amber-100 transition-colors"
              >
                <span className="w-2 h-2 rounded-[4px] bg-amber-500 animate-pulse" />
                {pending} {pending === 1 ? "pendiente" : "pendientes"}
              </Link>
            )}
            <Link
              href="/admin/settings"
              aria-label="Configuración"
              className={`p-2 rounded-[4px] text-stone-500 hover:bg-stone-100 transition-colors ${
                pathname === "/admin/settings" ? "bg-brand text-ink" : ""
              }`}
            >
              <Settings size={18} />
            </Link>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. DRAWER / SLIDE-OVER MÓVIL Y TABLET                      */}
      {/* ========================================================= */}
      {/* Backdrop */}
      <div
        onClick={() => setMenuOpen(false)}
        className={`fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300 ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      />

      {/* Panel lateral deslizante */}
      <aside
        className={`fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white z-50 flex flex-col shadow-2xl lg:hidden transform transition-transform duration-300 ease-out border-r border-stone-200 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logos/logo-black.svg"
              alt="Joy Joy"
              width={85}
              height={22}
              className="h-5.5 w-auto shrink-0"
            />
            <span className="text-xs font-medium text-stone-500 border-l border-stone-200 pl-2">
              Admin
            </span>
          </div>
          <button
            onClick={() => setMenuOpen(false)}
            aria-label="Cerrar menú"
            className="flex items-center justify-center h-9 w-9 rounded-[4px] text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <NavLinksList />
        </div>

        <div className="p-4 border-t border-stone-100 bg-stone-50/50">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 text-sm text-stone-600 hover:text-red-600 hover:bg-red-50 py-2.5 px-3 rounded-[4px] transition-colors font-medium"
          >
            <LogOut size={17} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 3. SIDEBAR VERTICAL FIJO PARA DESKTOP (>= lg)              */}
      {/* ========================================================= */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 bg-white border-r border-stone-200 flex-col z-30 shadow-xs">
        {/* Encabezado del sidebar */}
        <div className="p-5 border-b border-stone-100">
          <Link href="/admin" className="block">
            <Image
              src="/logos/logo-black.svg"
              alt="Joy Joy"
              width={105}
              height={27}
              className="h-6 w-auto mb-2"
            />
          </Link>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs font-medium text-stone-700 truncate max-w-[150px]">
              {salonName}
            </p>
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-[4px]">
              <span className="w-1.5 h-1.5 rounded-[4px] bg-emerald-500 animate-pulse" />
              Panel
            </span>
          </div>
        </div>

        {/* Lista de navegación principal con scroll independiente */}
        <div className="flex-1 overflow-y-auto px-3.5 py-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <NavLinksList />
        </div>

        {/* Pie del sidebar: perfil y botón de cerrar sesión */}
        <div className="p-3.5 border-t border-stone-100 bg-stone-50/40">
          <div className="flex items-center justify-between px-2 py-1 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-[4px] bg-brand/20 text-brand-deep flex items-center justify-center text-xs font-bold">
                AD
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-stone-800 leading-tight">Admin</p>
                <p className="text-[10px] text-stone-600 truncate leading-tight">Sesión activa</p>
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 text-xs text-stone-600 hover:text-red-600 hover:bg-red-50 py-2 px-2.5 rounded-[4px] transition-colors font-medium"
          >
            <LogOut size={15} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}