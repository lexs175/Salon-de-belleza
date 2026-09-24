"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowUpRight, Menu, X } from "lucide-react";
import BookButton from "./BookButton";
import PromotionBanner from "./PromotionBanner";
import { waLink } from "@/lib/format";
import type { Promotion } from "@/lib/types";

const LINKS = [
  { href: "#servicios", label: "Servicios" },
  { href: "#transformaciones", label: "Antes y Después" },
  { href: "#equipo", label: "Equipo" },
  { href: "#salon", label: "El Salón" },
  { href: "#opiniones", label: "Opiniones" },
  { href: "#contacto", label: "Contacto" },
];

export default function PublicHeader({
  salonName,
  phone,
  promo,
  currency,
}: {
  salonName: string;
  phone: string;
  promo: Promotion | null;
  currency: string;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed top-0 inset-x-0 z-50">
      {promo && <PromotionBanner promo={promo} currency={currency} />}

      <header
        className={`w-full transition-all duration-300 ${
          scrolled
            ? "bg-stone-950/90 backdrop-blur-md border-b border-white/10 py-4"
            : "bg-gradient-to-b from-black/80 via-black/40 to-transparent py-5"
        }`}
      >
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 flex items-center justify-between">
          
          {/* Brand Logo */}
          <a href="#inicio" className="block shrink-0">
            <Image
              src="/logos/logo-white.svg"
              alt={salonName}
              width={100}
              height={38}
              priority
              className="h-6 sm:h-7 w-auto"
            />
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 lg:gap-12">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-xs uppercase tracking-[0.2em] font-medium text-white/80 hover:text-white transition-colors"
              >
                {l.label}
              </a>
            ))}
          </nav>

          {/* Right Action */}
          <div className="flex items-center gap-5">
            <BookButton variant="primary" size="md">
              <span>Reservar Cita</span>
              <ArrowUpRight size={14} />
            </BookButton>

            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setOpen(true)}
              aria-label="Abrir Menú"
              className="md:hidden p-1 text-white"
            >
              <Menu size={24} />
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Editorial Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 bg-stone-950 text-white flex flex-col justify-between p-8">
          <div className="flex items-center justify-between border-b border-white/15 pb-6">
            <Image
              src="/logos/logo-white.svg"
              alt={salonName}
              width={100}
              height={38}
              className="h-7 w-auto"
            />
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar Menú"
              className="p-1 text-white hover:text-stone-300"
            >
              <X size={26} />
            </button>
          </div>

          <div className="flex flex-col space-y-6 py-10">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="font-serif text-3xl sm:text-4xl text-white hover:text-stone-300 transition-colors border-b border-white/10 pb-3"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="space-y-4 pt-6 border-t border-white/15">
            <BookButton
              onClick={() => setOpen(false)}
              variant="primary"
              size="full"
            >
              <span>Reservar Cita en Línea</span>
              <ArrowUpRight size={15} />
            </BookButton>

            {phone && (
              <a
                href={waLink(phone, "Hola, me gustaría información para reservar una cita.")}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-xs uppercase tracking-widest text-white/70 hover:text-white py-2"
              >
                Contactar por WhatsApp
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}