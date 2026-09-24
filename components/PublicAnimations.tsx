"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function PublicAnimations() {
  useEffect(() => {
    const mm = gsap.matchMedia();

    mm.add(
      { reduceMotion: "(prefers-reduced-motion: reduce)" },
      (context) => {
        const reduceMotion = context.conditions?.reduceMotion ?? false;
        if (reduceMotion) {
          gsap.set("[data-hero-anim]", { autoAlpha: 1 });
          return;
        }

        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        tl.fromTo(
          "[data-hero-anim]",
          { autoAlpha: 0, y: 36 },
          { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.14, delay: 0.2 }
        );

        gsap.to("[data-hero-image]", {
          yPercent: 12,
          ease: "none",
          scrollTrigger: {
            trigger: "[data-hero]",
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });

        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
          gsap.fromTo(
            el,
            { autoAlpha: 0, y: 44 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 1,
              ease: "power3.out",
              scrollTrigger: {
                trigger: el,
                start: "top 85%",
              },
            }
          );
        });

        gsap.utils.toArray<HTMLElement>("[data-reveal-stagger]").forEach((group) => {
          gsap.fromTo(
            group.querySelectorAll("[data-reveal-item]"),
            { autoAlpha: 0, y: 40 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.9,
              ease: "power3.out",
              stagger: 0.12,
              scrollTrigger: {
                trigger: group,
                start: "top 82%",
              },
            }
          );
        });
      }
    );

    return () => {
      mm.revert();
    };
  }, []);

  return null;
}