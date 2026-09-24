"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "lenis/dist/lenis.css";

declare global {
  interface Window {
    __lenis?: Lenis;
    __stopLenis?: () => void;
    __startLenis?: () => void;
  }
}

export default function SmoothScroll() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Respetar preferencias de accesibilidad
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.5,
      prevent: (node) => {
        // Prevenir captura de scroll en modales y contenedores marcados
        return (
          node.hasAttribute?.("data-lenis-prevent") ||
          Boolean(node.closest?.("[data-lenis-prevent]")) ||
          Boolean(node.closest?.("[role='dialog']"))
        );
      },
    });

    window.__lenis = lenis;
    window.__stopLenis = () => {
      lenis.stop();
    };
    window.__startLenis = () => {
      lenis.start();
    };

    // Conectar eventos de scroll de Lenis a GSAP ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);

    // Conectar el bucle de animación de GSAP con el RAF de Lenis
    const updateRaf = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateRaf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(updateRaf);
      lenis.destroy();
      delete window.__lenis;
      delete window.__stopLenis;
      delete window.__startLenis;
    };
  }, []);

  return null;
}
