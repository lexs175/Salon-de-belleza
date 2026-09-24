import { ArrowRight, Megaphone } from "lucide-react";
import BookButton from "./BookButton";
import type { Promotion } from "@/lib/types";

export default function PromotionBanner({
  promo,
  currency,
}: {
  promo: Promotion | null;
  currency: string;
}) {
  if (!promo || !promo.active) return null;

  const originalPrice = promo.service_price && promo.service_price > 0 ? promo.service_price : (promo.price ?? 0);
  const discountPrice = originalPrice > 0 ? Math.round(originalPrice * (1 - promo.discount / 100)) : 0;
  const isFirstVisit = promo.promo_type === "first_visit";

  return (
    <div className="relative z-10">
      <div className="bg-stone-950 text-white border-b border-white/15">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-10 py-2.5 sm:py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <span className="hidden sm:inline-flex items-center gap-1.5 shrink-0 text-[10px] font-mono font-medium uppercase tracking-[0.2em] border border-white/20 text-[#E2D6C6] rounded-[4px] px-2.5 py-1">
              <Megaphone size={12} />
              {isFirstVisit ? "Primera Visita" : "Oferta Web"}
            </span>

            <p className="font-serif text-sm sm:text-base leading-tight truncate text-stone-100">
              <Megaphone size={12} className="inline-block align-middle mr-1.5 sm:hidden shrink-0 text-[#E2D6C6]" />
              {promo.title}
              {promo.service_id ? (
                promo.service_name && (
                  <span className="font-sans font-light text-stone-400 text-xs sm:text-sm ml-2">
                    en {promo.service_name}
                  </span>
                )
              ) : (
                <span className="font-sans font-light text-stone-400 text-xs sm:text-sm ml-2">
                  en todos los servicios
                </span>
              )}
            </p>

            {promo.discount > 0 && (
              <span className="shrink-0 text-xs font-mono font-semibold bg-[#FAF8F5] text-stone-950 rounded-[4px] px-2 py-0.5">
                -{promo.discount}%
              </span>
            )}

            {promo.service_id && originalPrice > 0 ? (
              <span className="hidden sm:inline-flex items-center gap-2 font-serif text-sm sm:text-base shrink-0">
                <span className="line-through text-stone-400 font-sans text-xs">
                  {currency} {originalPrice.toLocaleString("es-BO")}
                </span>
                <span className="font-bold text-white">
                  {currency} {discountPrice.toLocaleString("es-BO")}
                </span>
              </span>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-1 font-serif text-xs text-stone-300 shrink-0">
                <span>Válido en todo el catálogo</span>
              </span>
            )}
          </div>

          <BookButton
            serviceId={promo.service_id}
            promotionId={promo.id}
            variant="promo"
            size="sm"
            className="group shrink-0"
          >
            <span>Reservar con Promo</span>
            <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-0.5" />
          </BookButton>
        </div>
      </div>
    </div>
  );
}