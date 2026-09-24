import type { Metadata } from "next";
import { Playfair_Display, Jost } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Salón de Belleza — Reservas en línea",
  description: "Reserva tu cita en línea: cortes, color, manicure y más.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${playfair.variable} ${jost.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-ivory text-ink">{children}</body>
    </html>
  );
}