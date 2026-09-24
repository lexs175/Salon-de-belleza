"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { Service } from "@/lib/types";
import BookButton from "./BookButton";

function serviceImage(s: Service): string {
  const n = s.name.toLowerCase();
  if (n.includes("corte")) return "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=900&q=80";
  if (n.includes("color") || n.includes("tinte")) return "https://images.unsplash.com/photo-1607779097040-26e80aa78e66?auto=format&fit=crop&w=900&q=80";
  if (n.includes("mani")) return "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=900&q=80";
  if (n.includes("pedi")) return "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=900&q=80";
  if (n.includes("maquill")) return "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=900&q=80";
  if (n.includes("keratina") || n.includes("alisad")) return "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=900&q=80";
  return "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=900&q=80";
}

export default function ServiceCard({ service, currency }: { service: Service; currency: string }) {
  const image = service.image || serviceImage(service);
  const external = image.startsWith("http");
  return (
    <article
      data-reveal-item
      className="group bg-white rounded-[4px] overflow-hidden border border-stone-200/80 hover:border-stone-300 transition-colors duration-300"
    >
      <div className="relative h-52 overflow-hidden">
        {external ? (
          <img
            src={image}
            alt={service.name}
            className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <Image
            src={image}
            alt={service.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-700"
          />
        )}
        <span className="absolute top-4 right-4 bg-white/90 backdrop-blur text-accent text-[11px] font-medium tracking-wide uppercase px-3 py-1.5 rounded-[4px]">
          {service.duration_minutes} min
        </span>
      </div>
      <div className="p-6 border-t border-stone-100">
        <h3 className="font-serif text-2xl text-ink mb-1.5">{service.name}</h3>
        {service.description && (
          <p className="text-sm text-stone-500 mb-6 font-light">{service.description}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="font-serif text-2xl text-accent leading-none">
            {formatPrice(currency, service.price)}
          </span>
          <BookButton
            serviceId={service.id}
            variant="outline"
            size="md"
            className="group/btn"
          >
            Reservar
            <ArrowRight size={15} className="transition-transform duration-300 group-hover/btn:translate-x-1" />
          </BookButton>
        </div>
      </div>
    </article>
  );
}