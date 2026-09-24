"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type PhotoItem = {
  id: string;
  src: string;
  alt: string;
  caption: string;
  positionClass: string;
  yFrom: string;
  yTo: string;
};

const PHOTOS: PhotoItem[] = [
  // --- Ola 1: Visibles al inicio, ascienden y salen por arriba ---
  {
    id: "p1",
    src: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=85",
    alt: "Estaciones de estilismo y tocadores de madera",
    caption: "01 • Sillones de peluquería",
    positionClass: "left-[3%] sm:left-[5%] lg:left-[7%] top-[28%] w-[160px] sm:w-[230px] lg:w-[290px] aspect-[9/16]",
    yFrom: "20vh",
    yTo: "-135vh",
  },
  {
    id: "p2",
    src: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1200&q=85",
    alt: "Zona de lavado y masaje capilar",
    caption: "02 • Lavado de cabello",
    positionClass: "right-[3%] sm:right-[5%] lg:right-[7%] top-[22%] w-[180px] sm:w-[270px] lg:w-[350px] aspect-[4/3]",
    yFrom: "10vh",
    yTo: "-125vh",
  },

  // --- Ola 2: Entran desde abajo mientras el texto permanece en el centro ---
  {
    id: "p3",
    src: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1200&q=85",
    alt: "Aceites esenciales y cuidado botánico",
    caption: "03 • Productos de calidad",
    positionClass: "left-[14%] sm:left-[17%] lg:left-[20%] top-[45%] w-[140px] sm:w-[200px] lg:w-[240px] aspect-square",
    yFrom: "75vh",
    yTo: "-155vh",
  },
  {
    id: "p4",
    src: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=1200&q=85",
    alt: "Movimiento y brillo de cabello cuidado",
    caption: "04 • Peinados y secado",
    positionClass: "right-[12%] sm:right-[15%] lg:right-[18%] top-[50%] w-[150px] sm:w-[220px] lg:w-[260px] aspect-[3/4]",
    yFrom: "65vh",
    yTo: "-150vh",
  },

  // --- Ola 3: Continúan subiendo sin detenerse ---
  {
    id: "p5",
    src: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=85",
    alt: "Luz natural en el área de corte",
    caption: "05 • Área de cortes",
    positionClass: "left-[4%] sm:left-[6%] lg:left-[8%] top-[65%] w-[170px] sm:w-[250px] lg:w-[310px] aspect-[16/10]",
    yFrom: "115vh",
    yTo: "-130vh",
  },
  {
    id: "p6",
    src: "https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?auto=format&fit=crop&w=1200&q=85",
    alt: "Té de cortesía y ritual de bienvenida",
    caption: "06 • Sala de espera",
    positionClass: "right-[4%] sm:right-[6%] lg:right-[8%] top-[68%] w-[140px] sm:w-[200px] lg:w-[240px] aspect-square",
    yFrom: "110vh",
    yTo: "-135vh",
  },

  // --- Ola 4: Cierran el recorrido antes de la salida fluida ---
  {
    id: "p7",
    src: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=1200&q=85",
    alt: "Colorimetría y mezclas artesanales",
    caption: "07 • Tintes y color",
    positionClass: "left-[18%] sm:left-[22%] lg:left-[25%] top-[78%] w-[150px] sm:w-[210px] lg:w-[260px] aspect-[4/5]",
    yFrom: "155vh",
    yTo: "-115vh",
  },
  {
    id: "p8",
    src: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=1200&q=85",
    alt: "Cuidado de uñas spa",
    caption: "08 • Manicura y pedicure",
    positionClass: "right-[16%] sm:right-[19%] lg:right-[22%] top-[82%] w-[170px] sm:w-[230px] lg:w-[290px] aspect-[16/10]",
    yFrom: "160vh",
    yTo: "-110vh",
  },
];

export default function SalonScrollytelling() {
  const containerRef = useRef<HTMLDivElement>(null);
  const photosRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // Timeline continua: el texto permanece centrado mientras las fotos suben sin detenerse
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1, // Sincronizado continuo con el scroll
        },
      });

      // Cada foto tiene un movimiento continuo lineal sin pausas intermedias
      photosRef.current.forEach((el, index) => {
        if (!el) return;
        const p = PHOTOS[index];
        if (!p) return;

        tl.fromTo(
          el,
          { y: p.yFrom },
          { y: p.yTo, ease: "none" },
          0
        );
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="salon"
      ref={containerRef}
      style={{ backgroundColor: "#000000", color: "#ffffff" }}
      className="relative h-[250vh] sm:h-[280vh] scroll-mt-20"
    >
      {/* Escenario Sticky: mantiene el texto siempre en el centro mientras las fotos van subiendo */}
      <div
        style={{ backgroundColor: "#000000" }}
        className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center"
      >
        {/* Viñeta cinematográfica oscura radial garantizada */}
        <div
          style={{
            background: "radial-gradient(circle at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0.5) 55%, rgba(0,0,0,0.95) 100%)",
          }}
          className="absolute inset-0 pointer-events-none z-1"
        />

        {/* TEXTO FIJO EN EL CENTRO EXACTO DE LA PANTALLA */}
        <div className="relative z-20 text-center max-w-4xl mx-auto px-6 select-none pointer-events-none">
          <p
            style={{ color: "#C5A880" }}
            className="text-[11px] sm:text-xs uppercase tracking-[0.35em] font-semibold mb-3 sm:mb-5"
          >
            Nuestras Instalaciones
          </p>
          <h2
            style={{ color: "#ffffff" }}
            className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-[5.5rem] leading-[1.04] tracking-tight uppercase"
          >
            Conoce el Salón
          </h2>
          <p
            style={{ color: "#D6D3D1" }}
            className="text-xs sm:text-base font-light max-w-xl mx-auto mt-4 sm:mt-6 leading-relaxed"
          >
            Equipamiento profesional, sillones cómodos, higiene estricta y el mejor ambiente para tu cita.
          </p>
        </div>

        {/* FOTOGRAFÍAS FLOTANTES: ascienden continuamente de abajo hacia arriba rebasando el texto */}
        {PHOTOS.map((photo, index) => (
          <div
            key={photo.id}
            ref={(el) => {
              photosRef.current[index] = el;
            }}
            className={`absolute z-10 ${photo.positionClass} pointer-events-auto`}
          >
            <div
              style={{
                backgroundColor: "#0d0d0f",
                borderColor: "rgba(255,255,255,0.18)",
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.9)",
              }}
              className="relative w-full h-full overflow-hidden rounded-[4px] border group transition-transform duration-500 hover:scale-[1.02]"
            >
              <img
                src={photo.src}
                alt={photo.alt}
                loading="lazy"
                className="w-full h-full object-cover brightness-[0.92] contrast-[1.06] transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div
                style={{
                  background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 60%)",
                }}
                className="absolute inset-0 opacity-60 group-hover:opacity-40 transition-opacity"
              />
              <span
                style={{ color: "rgba(255,255,255,0.92)" }}
                className="absolute bottom-2.5 left-3 text-[10px] sm:text-xs font-mono tracking-wider uppercase"
              >
                {photo.caption}
              </span>
            </div>
          </div>
        ))}

        {/* Micro-indicador inferior */}
        <div
          style={{ color: "rgba(255,255,255,0.4)" }}
          className="absolute bottom-6 inset-x-0 text-center pointer-events-none z-20 text-[10px] sm:text-[11px] font-mono tracking-widest uppercase"
        >
          Desliza para ver más fotos
        </div>

      </div>
    </section>
  );
}
