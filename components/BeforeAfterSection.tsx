"use client";

import { useState, useRef } from "react";
import { MoveHorizontal } from "lucide-react";
import { formatPrice } from "@/lib/format";
import BookButton from "./BookButton";

type Transformation = {
  id: string;
  service: string;
  category: string;
  serviceId: number;
  duration: string;
  price: number;
  description: string;
  beforeImg: string;
  afterImg: string;
  beforeLabel: string;
  afterLabel: string;
};

const TRANSFORMATIONS: Transformation[] = [
  {
    id: "color",
    service: "Color / Tinte & Balayage",
    category: "Colorimetría",
    serviceId: 2,
    duration: "120 min",
    price: 800,
    description:
      "Corrección de color y balayage dimensional. Se eliminaron reflejos oxidados y se devolvió luminosidad, contraste suave y nutrición profunda a la fibra.",
    beforeImg: "/transformations/before-balayage.jpg",
    afterImg: "/transformations/after-balayage.jpg",
    beforeLabel: "Antes: Tono oxidado y puntas deshidratadas",
    afterLabel: "Después: Balayage miel dimensional con brillo espejo",
  },
  {
    id: "keratina",
    service: "Alisado / Keratina",
    category: "Tratamiento Capilar",
    serviceId: 6,
    duration: "180 min",
    price: 1500,
    description:
      "Alisado reconstructivo con keratina botánica. Reducción total de frizz, sellado de cutícula y alineación perfecta manteniendo volumen natural y movimiento.",
    beforeImg: "/transformations/before-keratin.jpg",
    afterImg: "/transformations/after-keratin.jpg",
    beforeLabel: "Antes: Frizz rebelde y porosidad excesiva",
    afterLabel: "Después: Liso sedoso, blindaje térmico y suavidad",
  },
  {
    id: "corte",
    service: "Corte de cabello & Brushing",
    category: "Corte & Estilismo",
    serviceId: 1,
    duration: "45 min",
    price: 250,
    description:
      "Corte estructurado con capas invisibles para aportar volumen y ligereza. Definición de puntas y peinado de acabado pulido adaptado a la forma del rostro.",
    beforeImg: "/transformations/before-cut.jpg",
    afterImg: "/transformations/after-cut.jpg",
    beforeLabel: "Antes: Puntas dañadas sin definición ni caída",
    afterLabel: "Después: Capas vivas, movimiento natural y densidad",
  },
];

export default function BeforeAfterSection({ currency }: { currency: string }) {
  const [activeTab, setActiveTab] = useState(0);
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const current = TRANSFORMATIONS[activeTab];

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pct);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    handleMove(e.clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!e.touches[0]) return;
    handleMove(e.touches[0].clientX);
  };

  return (
    <section id="transformaciones" className="py-24 sm:py-32 border-b border-stone-300 scroll-mt-20">
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
          <div>
            <h2 className="font-serif text-4xl sm:text-6xl text-stone-900 leading-[1.05]">
              Antes y Después
            </h2>
            <p className="text-stone-600 font-light text-base sm:text-lg mt-3 max-w-xl">
              Resultados reales de clientas al entrar y salir de nuestro salón. Desliza la barra para comparar el cambio.
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {TRANSFORMATIONS.map((t, index) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setActiveTab(index);
                  setSliderPos(50);
                }}
                className={`text-xs uppercase tracking-wider font-semibold px-4 py-2.5 rounded-[4px] transition-colors ${
                  activeTab === index
                    ? "bg-stone-950 text-white"
                    : "bg-stone-200/70 text-stone-700 hover:bg-stone-300"
                }`}
              >
                {t.category}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Compare Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Slider Container */}
          <div className="lg:col-span-8">
            <div
              ref={containerRef}
              onMouseDown={(e) => {
                isDragging.current = true;
                handleMove(e.clientX);
              }}
              onMouseUp={() => (isDragging.current = false)}
              onMouseLeave={() => (isDragging.current = false)}
              onMouseMove={onMouseMove}
              onTouchStart={(e) => {
                isDragging.current = true;
                if (e.touches[0]) handleMove(e.touches[0].clientX);
              }}
              onTouchEnd={() => (isDragging.current = false)}
              onTouchMove={onTouchMove}
              className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden select-none cursor-ew-resize bg-stone-900 border border-stone-300 rounded-[4px]"
            >
              {/* After Image (Background) */}
              <img
                src={current.afterImg}
                alt={current.afterLabel}
                draggable={false}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
              />

              {/* Before Image (Clipped by slider position via native CSS clipPath) */}
              <div
                className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none"
                style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
              >
                <img
                  src={current.beforeImg}
                  alt={current.beforeLabel}
                  draggable={false}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>

              {/* Central Divider Bar */}
              <div
                className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_12px_rgba(0,0,0,0.6)] pointer-events-none"
                style={{ left: `${sliderPos}%` }}
              >
                {/* Drag Handle Button */}
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 bg-white text-stone-950 rounded-full shadow-lg flex items-center justify-center border border-stone-300">
                  <MoveHorizontal size={16} />
                </div>
              </div>

              {/* Tags: Antes / Después */}
              <div className="absolute top-4 left-4 bg-stone-950/80 backdrop-blur-xs text-white text-[11px] font-mono uppercase tracking-widest px-3 py-1.5 rounded-[4px] pointer-events-none">
                Antes
              </div>
              <div className="absolute top-4 right-4 bg-stone-950/80 backdrop-blur-xs text-white text-[11px] font-mono uppercase tracking-widest px-3 py-1.5 rounded-[4px] pointer-events-none">
                Después
              </div>
            </div>

            {/* Micro Caption */}
            <p className="text-xs text-stone-500 font-mono mt-3 flex items-center justify-between">
              <span>← Arrastra el divisor hacia los lados para comparar</span>
              <span className="hidden sm:inline-block">Fotos reales tomadas en el salón</span>
            </p>
          </div>

          {/* Details & Direct Booking Action */}
          <div className="lg:col-span-4 flex flex-col justify-between h-full space-y-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-stone-500 block mb-1">
                Tratamiento Realizado
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl text-stone-950 font-medium mb-3">
                {current.service}
              </h3>
              <p className="text-sm text-stone-600 font-light leading-relaxed mb-6">
                {current.description}
              </p>

              {/* Details List */}
              <div className="space-y-3 py-4 border-y border-stone-200 text-xs sm:text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Duración del procedimiento:</span>
                  <span className="font-medium text-stone-950">{current.duration}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Precio del servicio:</span>
                  <span className="font-serif text-xl font-bold text-stone-950">
                    {formatPrice(currency, current.price)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <BookButton
                serviceId={current.serviceId}
                variant="dark"
                size="full"
              >
                Reservar Este Mismo Tratamiento
              </BookButton>
              <p className="text-[11px] text-stone-500 text-center font-light">
                Confirmación inmediata en el calendario oficial
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
