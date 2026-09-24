"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Sparkles } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export default function Gallery({ images }: { images: string[] }) {
  const mobileRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const section = mobileRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduce(e.matches);
    mq.addEventListener("change", onChange);

    const mm = gsap.matchMedia();

    mm.add(
      { reduceMotion: "(prefers-reduced-motion: reduce)", isTouch: "(hover: none)" },
      (ctx) => {
        if (ctx.conditions?.reduceMotion || !ctx.conditions?.isTouch) return;
        const getDistance = () => Math.max(0, track.scrollWidth - window.innerWidth);
        ScrollTrigger.create({
          trigger: section,
          start: "top top",
          end: () => "+=" + getDistance(),
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            gsap.set(track, { x: -self.progress * getDistance() });
          },
        });
      }
    );

    return () => {
      mq.removeEventListener("change", onChange);
      mm.revert();
    };
  }, []);

  return (
    <div className="w-full">
      {/* Mobile Horizontal Filmstrip */}
      <div ref={mobileRef} className="hidden [@media(hover:none)]:block pb-10">
        <div className="px-4 sm:px-6 pt-6 pb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-gold uppercase tracking-[0.35em] text-xs flex items-center gap-1.5">
              <Sparkles size={12} />
              <span>Atelier Visuals</span>
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-white leading-[1.05] mt-2">
              Atmósfera & Detalles
            </h2>
          </div>
        </div>
        <div
          className={`h-[58vh] flex items-center relative overflow-hidden ${
            reduce ? "overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" : ""
          }`}
        >
          <div ref={trackRef} className="flex gap-4 w-max pl-4 pr-10 h-full">
            {images.map((src, i) => (
              <div
                key={src}
                className={`relative w-[78vw] h-full shrink-0 overflow-hidden rounded-[4px] border border-white/10 ${
                  reduce ? "snap-center" : ""
                }`}
              >
                <Image
                  src={src}
                  alt={`Atelier ${i + 1}`}
                  fill
                  sizes="(max-width: 1023px) 78vw, 20vw"
                  className="object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-ink via-ink/40 to-transparent">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold mb-1">
                    Atelier — 0{i + 1}
                  </p>
                  <p className="font-serif text-lg text-white">Espacio & Armonía</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop Expansive Editorial Accordion */}
      <div
        className="hidden [@media(hover:hover)]:flex h-[560px] gap-3 px-4 sm:px-6 max-w-[1440px] mx-auto pb-16"
        data-reveal
      >
        {images.map((src, i) => (
          <div
            key={src}
            className="group relative flex-1 min-w-0 overflow-hidden rounded-[4px] border border-white/10 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:flex-[3.5] bg-stone-900 cursor-pointer"
          >
            <Image
              src={src}
              alt={`Atelier ${i + 1}`}
              fill
              sizes="(max-width: 640px) 16vw, 25vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-500" />
            
            <div className="absolute top-5 left-5 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <span className="glass-dark-pill text-[10px] uppercase tracking-[0.25em] text-white/90 px-3 py-1.5 rounded-[4px] font-medium">
                0{i + 1} / PERSPECTIVA
              </span>
            </div>

            <div className="absolute inset-x-0 bottom-0 p-6 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold mb-1">
                Atelier & Studio
              </p>
              <p className="font-serif text-2xl text-white">Momentos de calma y diseño</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}