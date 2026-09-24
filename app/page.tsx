import Image from "next/image";
import { ArrowDown, ArrowUpRight, AtSign, MapPin, Phone } from "lucide-react";
import { parseHours, waLink } from "@/lib/format";
import { getActivePromotion, getServices, getSettings, getStaff } from "@/lib/db";
import BookingModal from "@/components/BookingModal";
import BookButton from "@/components/BookButton";
import { buttonClasses } from "@/components/ui/Button";
import PublicAnimations from "@/components/PublicAnimations";
import SmoothScroll from "@/components/SmoothScroll";
import PublicHeader from "@/components/PublicHeader";
import TreatmentIndex from "@/components/TreatmentIndex";
import TeamLookbook from "@/components/TeamLookbook";
import BeforeAfterSection from "@/components/BeforeAfterSection";
import SalonScrollytelling from "@/components/SalonScrollytelling";

export const dynamic = "force-dynamic";

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const HERO_BG =
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=2400&q=85";

const TESTIMONIALS = [
  {
    quote:
      "La atención es puntual y profesional. Me hicieron un balayage con un acabado natural que superó lo que esperaba. Ya es mi lugar fijo todos los meses.",
    author: "Andrea Ruiz",
    role: "Cliente regular",
    service: "Color / Tinte",
  },
  {
    quote:
      "Poder agendar desde la página en menos de un minuto sin tener que esperar a que respondan un WhatsApp o una llamada hace toda la diferencia. Llegué y me atendieron a la hora exacta.",
    author: "Gabriela Méndez",
    role: "Cliente regular",
    service: "Corte de cabello",
  },
  {
    quote:
      "El tratamiento de keratina dejó mi cabello suave y sin frizz por meses. Los productos son de primera calidad y las estilistas son muy cuidadosas y atentas.",
    author: "Valentina Cruz",
    role: "Cliente regular",
    service: "Alisado / Keratina",
  },
];

const TEAM = [
  {
    name: "María Fernanda Ríos",
    role: "Estilista Senior & Colorista",
    specialty: "Cortes modernos, colorimetría completa, balayage y mechas.",
    photo:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Carla Mendoza",
    role: "Maquilladora Profesional",
    specialty: "Maquillaje para eventos, novias, graduaciones y perfilado.",
    photo:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Lucía Vargas",
    role: "Especialista Capilar",
    specialty: "Alisados brasileños, keratina profesional y restauración capilar.",
    photo:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Daniela Flores",
    role: "Manicurista",
    specialty: "Manicure rusa, pedicure spa, extensiones y diseño de uñas.",
    photo:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=800&q=80",
  },
];

export default async function Home() {
  const [settings, services, promo, staffList] = await Promise.all([
    getSettings(),
    getServices(true),
    getActivePromotion(),
    getStaff(true),
  ]);

  const servicesMap = new Map(services.map((s) => [s.id, s.name]));

  const teamData =
    staffList.length > 0
      ? staffList.map((m, idx) => {
          const assignedServiceNames = (m.services || [])
            .map((id) => servicesMap.get(id))
            .filter(Boolean) as string[];

          const specialty =
            assignedServiceNames.length > 0
              ? `Especialista en ${assignedServiceNames.join(", ")}.`
              : m.role || "Atención y estilismo profesional.";

          const fallbackPhoto =
            TEAM[idx % TEAM.length]?.photo ||
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80";

          return {
            id: m.id,
            name: m.name,
            role: m.role,
            specialty,
            photo: m.avatar && m.avatar.trim() !== "" ? m.avatar : fallbackPhoto,
          };
        })
      : TEAM;

  const hours = parseHours(settings.hours);
  const hourLines = Object.entries(hours)
    .filter(([, v]) => v)
    .map(([k, v]) => ({ day: DAY_NAMES[Number(k)], range: v! }));

  return (
    <main className="flex-1 bg-stone-50 text-stone-900 selection:bg-stone-900 selection:text-white">
      <PublicHeader
        salonName={settings.salon_name}
        phone={settings.phone}
        promo={promo ?? null}
        currency={settings.currency}
      />
      <PublicAnimations />
      <SmoothScroll />
      <BookingModal
        services={services}
        currency={settings.currency}
        hours={hours}
        salonName={settings.salon_name}
        staff={staffList}
      />

      {/* FULLSCREEN CINEMATIC HERO SECTION */}
      <section
        id="inicio"
        data-hero
        className="relative min-h-[100svh] flex flex-col justify-between pt-32 pb-14 text-white overflow-hidden bg-stone-950"
      >
        {/* Full-Bleed Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src={HERO_BG}
            alt="Interior del salón de belleza Joy Joy"
            fill
            priority
            unoptimized
            sizes="100vw"
            className="object-cover object-center brightness-[0.42] contrast-[1.08]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-stone-950/60" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-[1440px] mx-auto px-6 sm:px-10 w-full my-auto py-12">
          <p
            data-hero-anim
            className="text-xs sm:text-sm uppercase tracking-[0.25em] text-stone-300 font-medium mb-4"
          >
            Salón de Belleza {settings.salon_name && settings.salon_name !== "Salón de Belleza" ? settings.salon_name : "Joy Joy"}
          </p>

          <h1
            data-hero-anim
            className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-[5.25rem] leading-[1.05] tracking-tight mb-6 max-w-5xl text-white"
          >
            Reserva tu cita para corte, color, manicure y estética capilar
          </h1>

          <p
            data-hero-anim
            className="text-white/85 text-base sm:text-lg md:text-xl font-light max-w-2xl leading-relaxed mb-8"
          >
            Elige el servicio, la fecha y la especialista que prefieras. Confirmación instantánea y atención puntual de lunes a sábado sin llamadas ni esperas.
          </p>

          <div data-hero-anim className="flex flex-wrap items-center gap-4 sm:gap-6">
            <BookButton variant="primary" size="lg">
              <span>Reservar Cita Ahora</span>
              <ArrowUpRight size={18} />
            </BookButton>

            <a
              href="#servicios"
              className={buttonClasses("outlineLight", "lg")}
            >
              <span>Ver Servicios & Precios</span>
              <ArrowDown size={16} />
            </a>
          </div>
        </div>

        {/* Hero Bottom Bar */}
        <div className="relative z-10 max-w-[1440px] mx-auto px-6 sm:px-10 w-full pt-8 border-t border-white/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs sm:text-sm text-white/75 font-light">
          <div className="flex flex-wrap items-center gap-6 sm:gap-10">
            <span>Cortes & Peinados</span>
            <span>•</span>
            <span>Colorimetría & Tintes</span>
            <span>•</span>
            <span>Manicure & Pedicure</span>
            <span>•</span>
            <span>Tratamientos Capilares</span>
          </div>
          <div>
            <span>Atención puntual de lunes a sábado de 09:00 a 19:00</span>
          </div>
        </div>
      </section>

      {/* SECCIÓN 1: SERVICIOS Y TARIFAS */}
      <section id="servicios" className="py-24 sm:py-32 border-b border-stone-300 scroll-mt-20">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16" data-reveal>
            <div>
              <h2 className="font-serif text-4xl sm:text-6xl text-stone-900 leading-[1.05]">
                Nuestros Servicios
              </h2>
              <p className="text-stone-600 font-light text-base sm:text-lg mt-3">
                Selecciona tu servicio para reservar cita online en el horario que mejor te convenga.
              </p>
            </div>
            <p className="text-xs uppercase tracking-wider text-stone-500 md:text-right font-medium">
              Precios y duración transparentes
            </p>
          </div>

          <TreatmentIndex services={services} currency={settings.currency} />
        </div>
      </section>

      {/* SECCIÓN 2: ANTES Y DESPUÉS (TRANSFORMACIONES REALES) */}
      <BeforeAfterSection currency={settings.currency} />

      {/* SECCIÓN 3: EQUIPO DE PROFESIONALES */}
      <section id="equipo" className="py-24 sm:py-32 border-b border-stone-300 scroll-mt-20 bg-stone-100/60">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14 sm:mb-20" data-reveal>
            <div>
              <h2 className="font-serif text-4xl sm:text-6xl text-stone-900 leading-[1.05]">
                Equipo de Especialistas
              </h2>
              <p className="text-stone-600 font-light text-base sm:text-lg mt-3">
                Profesionales con amplia trayectoria en cortes, colorimetría, cuidado capilar y estética.
              </p>
            </div>
            <p className="text-xs uppercase tracking-wider text-stone-500 md:text-right font-medium">
              Puedes elegir a tu estilista favorita al reservar
            </p>
          </div>

          <TeamLookbook team={teamData} />
        </div>
      </section>

      {/* SECCIÓN 4: EL SALÓN (SCROLLYTELLING EDITORIAL) */}
      <SalonScrollytelling />

      {/* SECCIÓN 5: OPINIONES DE CLIENTAS */}
      <section id="opiniones" className="py-24 sm:py-32 border-b border-stone-300 scroll-mt-20">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10">
          <div className="mb-14 sm:mb-20" data-reveal>
            <h2 className="font-serif text-4xl sm:text-6xl text-stone-900 leading-[1.05]">
              Opiniones de Clientas
            </h2>
            <p className="text-stone-600 font-light text-base sm:text-lg mt-3">
              Experiencias de personas que confían en nuestro salón cada mes.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10" data-reveal-stagger>
            {TESTIMONIALS.map((t, i) => (
              <article
                key={i}
                data-reveal-item
                className="flex flex-col justify-between p-8 sm:p-10 border border-stone-300 bg-white rounded-[4px]"
              >
                <blockquote className="font-serif text-lg sm:text-xl text-stone-900 leading-relaxed italic mb-8">
                  “{t.quote}”
                </blockquote>

                <div className="pt-6 border-t border-stone-200">
                  <p className="text-sm font-semibold text-stone-950">
                    {t.author}
                  </p>
                  <p className="text-xs text-stone-500 mt-1">
                    {t.service}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* SECCIÓN 6: RESERVA DIRECTA */}
      <section className="bg-stone-950 text-white py-28 sm:py-36 px-6 border-b border-stone-800">
        <div className="max-w-4xl mx-auto text-center" data-reveal>
          <h2 className="font-serif text-5xl sm:text-7xl lg:text-8xl leading-[0.95] tracking-tight mb-6">
            Reserva tu cita en línea
          </h2>
          <p className="text-white/80 text-base sm:text-lg font-light max-w-xl mx-auto mb-10 leading-relaxed">
            Elige el servicio, la fecha y la especialista que prefieras en nuestra agenda digital. Confirmación instantánea sin intermediarios.
          </p>
          <BookButton variant="primary" size="lg">
            <span>Iniciar Reserva de Cita</span>
            <ArrowUpRight size={18} />
          </BookButton>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contacto" className="bg-stone-950 text-white py-16 sm:py-20">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-16 pb-16 border-b border-stone-800">
            
            {/* Columna 1: Información */}
            <div className="lg:col-span-4">
              <Image
                src="/logos/logo-white.svg"
                alt={settings.salon_name}
                width={120}
                height={45}
                className="h-7 w-auto mb-6"
              />
              <p className="text-stone-400 font-light text-sm max-w-sm leading-relaxed mb-6">
                {settings.description || settings.slogan}
              </p>
              <div className="flex items-center gap-6 text-stone-300 text-xs">
                {settings.instagram && (
                  <a
                    href={`https://www.instagram.com/${settings.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white uppercase tracking-wider"
                  >
                    Instagram ↗
                  </a>
                )}
                {settings.phone && (
                  <a
                    href={waLink(settings.phone, "Hola, me gustaría información del salón de belleza.")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white uppercase tracking-wider"
                  >
                    WhatsApp ↗
                  </a>
                )}
              </div>
            </div>

            {/* Columna 2: Ubicación & Contacto */}
            <div className="lg:col-span-4">
              <p className="text-xs uppercase tracking-wider text-stone-400 mb-6 font-medium">
                Ubicación & Contacto
              </p>
              {settings.address && (
                <p className="text-sm text-stone-300 font-light leading-relaxed mb-3">
                  {settings.address}
                </p>
              )}
              {settings.phone && (
                <p className="text-sm text-stone-300">
                  Teléfono: <a href={`tel:${settings.phone}`} className="hover:text-white">{settings.phone}</a>
                </p>
              )}
            </div>

            {/* Columna 3: Horarios */}
            <div className="lg:col-span-4">
              <p className="text-xs uppercase tracking-wider text-stone-400 mb-6 font-medium">
                Horarios de Atención
              </p>
              <div className="space-y-2 text-xs sm:text-sm">
                {hourLines.map((l) => {
                  const isToday = l.day === DAY_NAMES[new Date().getDay()];
                  return (
                    <div
                      key={l.day}
                      className={`flex items-center justify-between py-1 border-b border-stone-800 ${
                        isToday ? "text-white font-semibold" : "text-stone-400"
                      }`}
                    >
                      <span>{l.day} {isToday ? "(Hoy)" : ""}</span>
                      <span>{l.range}</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
            <p>© {new Date().getFullYear()} {settings.salon_name}. Reservas de Salón de Belleza.</p>
            <p>Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}