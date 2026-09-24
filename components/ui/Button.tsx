import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "dark" | "outline" | "outlineLight" | "promo";
export type ButtonSize = "sm" | "md" | "lg" | "full";

// Base tomada del botón del navbar: misma tipografía, mismo tracking,
// mismo radius fijo de 4px. Las variantes solo cambian color/fondo.
const BASE =
  "inline-flex items-center justify-center gap-2 rounded-[4px] text-xs uppercase tracking-[0.15em] font-semibold transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2";

const VARIANTS: Record<ButtonVariant, string> = {
  // Navbar / hero sobre fondo oscuro
  primary: "bg-white text-stone-950 hover:bg-stone-200",
  // Sobre fondo claro (listas, cards oscuras, antes/después)
  dark: "bg-stone-950 text-white hover:bg-stone-800",
  // ServiceCard: borde + relleno al hover
  outline: "border border-stone-950/40 text-stone-950 hover:bg-stone-950 hover:text-white",
  // "Ver servicios" sobre hero oscuro
  outlineLight: "border border-white/30 text-white/90 hover:text-white hover:border-white",
  // Promo: es diferente a propósito (verde, no uppercase estricto).
  // Mantiene su color, pero hereda base: mismo radius 4px y misma estructura.
  promo:
    "bg-green-200 text-stone-950 hover:bg-green-300 normal-case tracking-wide font-medium",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "px-3.5 py-1.5",
  md: "px-5 sm:px-6 py-2.5 sm:py-3",
  lg: "px-8 sm:px-10 py-4",
  full: "w-full px-6 py-4",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  extra = ""
) {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]}${extra ? ` ${extra}` : ""}`;
}

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}: Props) {
  return (
    <button {...rest} className={buttonClasses(variant, size, className)}>
      {children}
    </button>
  );
}
