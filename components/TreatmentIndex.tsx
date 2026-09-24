"use client";

import { useState } from "react";
import { Clock } from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { Service } from "@/lib/types";
import BookButton from "./BookButton";

function serviceImage(s: Service): string {
  if (s.image) return s.image;
  const n = s.name.toLowerCase();
  if (n.includes("corte"))
    return "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=1200&q=85";
  if (n.includes("color") || n.includes("tinte") || n.includes("balayage"))
    return "https://images.unsplash.com/photo-1607779097040-26e80aa78e66?auto=format&fit=crop&w=1200&q=85";
  if (n.includes("mani"))
    return "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1200&q=85";
  if (n.includes("pedi"))
    return "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=1200&q=85";
  if (n.includes("maquill"))
    return "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=1200&q=85";
  if (n.includes("keratina") || n.includes("alisad") || n.includes("restaur"))
    return "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=1200&q=85";
  if (n.includes("masaj"))
    return "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=85";
  return "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=1200&q=85";
}

export default function TreatmentIndex({
  services,
  currency,
}: {
  services: Service[];
  currency: string;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const active = services[selectedIndex] || services[0] || null;

  return (
    <div className="w-full">
      {/* ================= DESKTOP SPLIT VIEW ================= */}
      <div className="hidden lg:grid grid-cols-12 gap-10 lg:gap-14 items-start">
        
        {/* Left Column: List of Services with direct booking button in each row */}
        <div className="lg:col-span-7 flex flex-col divide-y divide-stone-200">
          {services.map((service, index) => {
            const num = String(index + 1).padStart(2, "0");
            const isSelected = selectedIndex === index;

            return (
              <div
                key={service.id}
                onClick={() => setSelectedIndex(index)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`group py-5 sm:py-6 px-4 sm:px-5 cursor-pointer transition-colors duration-150 rounded-[4px] ${
                  isSelected ? "bg-stone-950" : "hover:bg-stone-950"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Number, Name & Details */}
                  <div className="flex items-start gap-4 sm:gap-5 flex-1 min-w-0">
                    <span
                      className={`text-xs font-mono font-medium pt-1 shrink-0 ${
                        isSelected
                          ? "text-white font-bold"
                          : "text-stone-400 group-hover:text-white/70"
                      }`}
                    >
                      {num}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <h3
                          className={`font-serif text-xl sm:text-2xl font-medium leading-snug ${
                            isSelected ? "text-white" : "text-stone-950 group-hover:text-white"
                          }`}
                        >
                          {service.name}
                        </h3>
                        <span
                          className={`font-serif text-lg font-semibold ${
                            isSelected ? "text-white" : "text-stone-950 group-hover:text-white"
                          }`}
                        >
                          {formatPrice(currency, service.price)}
                        </span>
                      </div>

                      <div
                        className={`flex items-center gap-2 text-xs mt-1 font-medium ${
                          isSelected ? "text-white/70" : "text-stone-500 group-hover:text-white/70"
                        }`}
                      >
                        <Clock
                          size={12}
                          className={isSelected ? "text-white/70" : "text-stone-400 group-hover:text-white/70"}
                        />
                        <span>{service.duration_minutes} min</span>
                      </div>

                      {service.description && (
                        <p
                          className={`text-xs sm:text-sm font-light mt-1.5 line-clamp-1 leading-relaxed ${
                            isSelected ? "text-white/70" : "text-stone-600 group-hover:text-white/70"
                          }`}
                        >
                          {service.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Real Booking Button Directly in the Row */}
                  <div className="shrink-0 pl-2">
                    <BookButton
                      serviceId={service.id}
                      variant={isSelected ? "primary" : "dark"}
                      size="sm"
                    >
                      Reservar Cita
                    </BookButton>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Photo Preview Stage */}
        <div className="lg:col-span-5 sticky top-28">
          {active && (
            <div className="relative aspect-[3/4] w-full max-w-md mx-auto bg-stone-900 overflow-hidden border border-stone-300 rounded-[4px]">
              <img
                key={active.id}
                src={serviceImage(active)}
                alt={active.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/20 to-transparent" />

              {/* Stage Info Bottom */}
              <div className="absolute bottom-6 inset-x-6 text-white">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs uppercase tracking-wider text-stone-300 font-medium">
                    {active.duration_minutes} minutos
                  </span>
                  <span className="font-serif text-2xl font-bold text-white">
                    {formatPrice(currency, active.price)}
                  </span>
                </div>
                <h4 className="font-serif text-2xl sm:text-3xl font-medium text-white mb-2">
                  {active.name}
                </h4>
                {active.description && (
                  <p className="text-sm text-stone-300 font-light leading-relaxed">
                    {active.description}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ================= MOBILE VIEW (CARDS WITH PHOTOS) ================= */}
      <div className="lg:hidden flex flex-col divide-y divide-stone-200 border-y border-stone-200">
        {services.map((service) => {
          const img = serviceImage(service);
          return (
            <div key={service.id} className="py-4 flex gap-3.5 items-center rounded-[4px] transition-colors active:bg-stone-100">
              {/* Photo Thumbnail */}
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-stone-200 shrink-0 border border-stone-300 rounded-[4px] overflow-hidden">
                <img
                  src={img}
                  alt={service.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-base font-medium text-stone-950 leading-tight">
                    {service.name}
                  </h3>
                  {service.description && (
                    <p className="text-xs text-stone-500 font-light line-clamp-1 mt-0.5">
                      {service.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between mt-2.5">
                  <div className="text-xs text-stone-600">
                    <span className="font-semibold text-stone-950 text-sm block">
                      {formatPrice(currency, service.price)}
                    </span>
                    <span className="text-stone-500 text-[11px]">
                      {service.duration_minutes} min
                    </span>
                  </div>

                  <BookButton
                    serviceId={service.id}
                    variant="dark"
                    size="sm"
                  >
                    Reservar
                  </BookButton>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
