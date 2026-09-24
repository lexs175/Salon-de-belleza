"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  Loader2,
  Receipt,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import type { Booking } from "@/lib/types";
import { AreaChart } from "./AreaChart";

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
const MONTH_SHORT = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

type ServiceStat = {
  name: string;
  count: number;
  income: number;
};

export default function IncomeAdmin({ currency }: { currency: string }) {
  const [allBookings, setAllBookings] = useState<Booking[] | null>(null);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/bookings")
      .then((r) => r.json())
      .then((data: { bookings: Booking[] }) => {
        if (active) {
          setAllBookings(data.bookings || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const now = new Date();
  const currentMonthIdx = (now.getMonth() - offset + 12) % 12;
  const year = now.getFullYear() - (offset > now.getMonth() ? 1 : 0);
  const currentMonthPrefix = `${year}-${String(currentMonthIdx + 1).padStart(2, "0")}`;

  // Mes anterior para calcular el crecimiento %
  const prevMonthIdx = (currentMonthIdx - 1 + 12) % 12;
  const prevYear = currentMonthIdx === 0 ? year - 1 : year;
  const prevMonthPrefix = `${prevYear}-${String(prevMonthIdx + 1).padStart(2, "0")}`;

  // Métricas del mes actual
  const monthCompletedBookings = useMemo(() => {
    return (allBookings ?? []).filter(
      (b) => b.date.startsWith(currentMonthPrefix) && b.status === "completada"
    );
  }, [allBookings, currentMonthPrefix]);

  const prevMonthCompletedBookings = useMemo(() => {
    return (allBookings ?? []).filter(
      (b) => b.date.startsWith(prevMonthPrefix) && b.status === "completada"
    );
  }, [allBookings, prevMonthPrefix]);

  const monthIncome = useMemo(() => {
    return monthCompletedBookings.reduce((sum, b) => sum + (b.service_price ?? 0), 0);
  }, [monthCompletedBookings]);

  const prevMonthIncome = useMemo(() => {
    return prevMonthCompletedBookings.reduce((sum, b) => sum + (b.service_price ?? 0), 0);
  }, [prevMonthCompletedBookings]);

  // Crecimiento porcentual mensual
  const growthPercent = useMemo(() => {
    if (prevMonthIncome === 0) return monthIncome > 0 ? 100 : 0;
    return Math.round(((monthIncome - prevMonthIncome) / prevMonthIncome) * 100);
  }, [monthIncome, prevMonthIncome]);

  // Ticket promedio
  const averageTicket = useMemo(() => {
    if (monthCompletedBookings.length === 0) return 0;
    return Math.round(monthIncome / monthCompletedBookings.length);
  }, [monthIncome, monthCompletedBookings]);

  // Desglose por servicio
  const serviceStats = useMemo(() => {
    const map = new Map<string, ServiceStat>();
    for (const b of monthCompletedBookings) {
      const key = b.service_name || "Servicio general";
      const existing = map.get(key) || { name: key, count: 0, income: 0 };
      existing.count += 1;
      existing.income += b.service_price ?? 0;
      map.set(key, existing);
    }
    return Array.from(map.values()).sort((a, b) => b.income - a.income);
  }, [monthCompletedBookings]);

  const topService = serviceStats[0] ?? null;

  // Datos para el AreaChart de Tremor con recharts (12 meses del año)
  const chartData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const prefix = `${year}-${String(i + 1).padStart(2, "0")}`;
      const completed = (allBookings ?? []).filter(
        (b) => b.date.startsWith(prefix) && b.status === "completada"
      );
      const inc = completed.reduce((sum, b) => sum + (b.service_price ?? 0), 0);
      return {
        mes: MONTH_SHORT[i],
        "Ingresos": inc,
        "Citas completadas": completed.length,
      };
    });
  }, [allBookings, year]);

  const yearTotal = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr["Ingresos"], 0);
  }, [chartData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-stone-400">
        <Loader2 className="animate-spin text-[#007356] mb-3" size={32} />
        <p className="text-sm">Cargando métricas de ingresos…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ========================================================= */}
      {/* 1. CABECERA CON NAVEGACIÓN MENSUAL                        */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-[4px] border border-stone-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              Ingresos y Métricas
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-[4px]">
              <span className="w-1.5 h-1.5 rounded-[4px] bg-emerald-600 animate-pulse" />
              Finanzas
            </span>
          </div>
          <p className="text-sm text-stone-500 mt-0.5">
            Evolución de facturación del salón y rendimiento por servicio
          </p>
        </div>

        {/* Stepper de Mes */}
        <div className="flex items-center bg-stone-100/80 p-1.5 rounded-[4px] border border-stone-200/70">
          <button
            onClick={() => setOffset((o) => o + 1)}
            aria-label="Mes anterior"
            className="p-2 hover:bg-white rounded-[4px] text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-bold text-stone-800 min-w-[140px] text-center capitalize">
            {MONTH_NAMES[currentMonthIdx]} {year}
          </span>
          <button
            onClick={() => setOffset((o) => Math.max(o - 1, 0))}
            disabled={offset === 0}
            aria-label="Mes siguiente"
            className="p-2 hover:bg-white rounded-[4px] text-stone-600 hover:text-stone-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. TARJETAS KPI (METRIC CARDS)                            */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Ingresos del Mes */}
        <div className="bg-white rounded-[4px] border border-stone-200/80 p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-600">
              Ingresos del mes
            </span>
            <div className="w-8 h-8 rounded-[4px] bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CircleDollarSign size={18} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            {currency} {monthIncome.toLocaleString("es-BO")}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            {growthPercent >= 0 ? (
              <span className="inline-flex items-center gap-0.5 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-[4px]">
                <ArrowUpRight size={13} />
                +{growthPercent}%
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-[4px]">
                <ArrowDownRight size={13} />
                {growthPercent}%
              </span>
            )}
            <span className="text-stone-600">vs. mes anterior</span>
          </div>
        </div>

        {/* KPI 2: Citas Completadas */}
        <div className="bg-white rounded-[4px] border border-stone-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-600">
              Citas completadas
            </span>
            <div className="w-8 h-8 rounded-[4px] bg-blue-50 text-blue-700 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            {monthCompletedBookings.length}
          </p>
          <p className="text-xs text-stone-600 mt-2">
            Turnos atendidos en {MONTH_NAMES[currentMonthIdx].toLowerCase()}
          </p>
        </div>

        {/* KPI 3: Ticket Promedio */}
        <div className="bg-white rounded-[4px] border border-stone-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-600">
              Ticket promedio
            </span>
            <div className="w-8 h-8 rounded-[4px] bg-purple-50 text-purple-700 flex items-center justify-center">
              <Receipt size={18} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            {currency} {averageTicket.toLocaleString("es-BO")}
          </p>
          <p className="text-xs text-stone-600 mt-2">Gasto promedio por cliente</p>
        </div>

        {/* KPI 4: Servicio Estrella */}
        <div className="bg-white rounded-[4px] border border-stone-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-600">
              Servicio estrella
            </span>
            <div className="w-8 h-8 rounded-[4px] bg-amber-50 text-amber-700 flex items-center justify-center">
              <Sparkles size={18} />
            </div>
          </div>
          <p className="text-lg font-bold text-stone-900 truncate tracking-tight">
            {topService ? topService.name : "Sin registros"}
          </p>
          <p className="text-xs text-stone-600 mt-2">
            {topService ? `${currency} ${topService.income.toLocaleString("es-BO")} recaudados` : "Completa reservas para ver datos"}
          </p>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. GRÁFICA DE ÁREA INTERACTIVA CON TREMOR RAW + RECHARTS   */}
      {/* ========================================================= */}
      <div className="bg-white rounded-[4px] border border-stone-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-stone-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-[#007356]" />
              <h2 className="text-lg font-bold text-stone-900">
                Evolución de Ingresos Anual ({year})
              </h2>
            </div>
            <p className="text-xs text-stone-600 mt-0.5">
              Curva de facturación mes a mes con gradiente dinámico y tooltips interactivos
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-stone-600">Facturación total {year}</p>
            <p className="text-xl font-extrabold text-[#007356]">
              {currency} {yearTotal.toLocaleString("es-BO")}
            </p>
          </div>
        </div>

        {/* Gráfica Tremor Raw AreaChart */}
        <div className="pt-2">
          <AreaChart
            data={chartData}
            index="mes"
            categories={["Ingresos"]}
            colors={["emerald"]}
            valueFormatter={(number: number) => `${currency} ${number.toLocaleString("es-BO")}`}
            fill="gradient"
            showLegend={false}
            showGridLines={true}
            yAxisWidth={75}
            className="h-72 sm:h-80"
          />
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. DESGLOSE DE SERVICIOS Y RENDIMIENTO                    */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ranking de servicios por recaudación (2 columnas) */}
        <div className="lg:col-span-2 bg-white rounded-[4px] border border-stone-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-[#007356]" />
              <h3 className="text-base font-bold text-stone-900">
                Recaudación por Servicio ({MONTH_NAMES[currentMonthIdx]})
              </h3>
            </div>
            <span className="text-xs text-stone-600 font-medium">
              {serviceStats.length} servicios realizados
            </span>
          </div>

          {serviceStats.length === 0 ? (
            <div className="text-center py-16 text-stone-400">
              <p className="text-sm font-medium">No hay reservas completadas este mes</p>
              <p className="text-xs text-stone-600 mt-1">
                Al marcar citas como "completada" en la agenda se registrarán los ingresos aquí.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {serviceStats.map((s, idx) => {
                const maxIncome = serviceStats[0].income || 1;
                const percentage = Math.round((s.income / (monthIncome || 1)) * 100);
                const barWidth = Math.max(6, Math.round((s.income / maxIncome) * 100));

                return (
                  <div key={s.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-[4px] bg-stone-100 text-stone-600 flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        <span className="text-stone-800 truncate">{s.name}</span>
                        <span className="text-stone-600 font-normal">({s.count} citas)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-stone-600 font-normal">{percentage}%</span>
                        <span className="font-bold text-stone-900 text-right min-w-[80px]">
                          {currency} {s.income.toLocaleString("es-BO")}
                        </span>
                      </div>
                    </div>
                    {/* Barra de progreso elegante */}
                    <div className="h-2 w-full bg-stone-100 rounded-[4px] overflow-hidden">
                      <div
                        className="h-full rounded-[4px] bg-gradient-to-r from-emerald-500 to-[#007356] transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Panel lateral: Últimos clientes atendidos */}
        <div className="bg-white rounded-[4px] border border-stone-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="text-base font-bold text-stone-900">Últimos cobros</h3>
            <span className="text-xs text-[#007356] font-semibold">Completadas</span>
          </div>

          {monthCompletedBookings.length === 0 ? (
            <p className="text-xs text-stone-600 text-center py-10">
              Aún no hay cobros registrados en {MONTH_NAMES[currentMonthIdx].toLowerCase()}.
            </p>
          ) : (
            <div className="space-y-3 divide-y divide-stone-100">
              {monthCompletedBookings.slice(0, 5).map((b) => (
                <div key={b.id} className="pt-2.5 first:pt-0 flex items-center justify-between text-xs">
                  <div className="min-w-0">
                    <p className="font-bold text-stone-800 truncate">{b.name}</p>
                    <p className="text-stone-600 truncate text-[11px]">
                      {b.service_name} · {b.date}
                    </p>
                  </div>
                  <span className="font-bold text-emerald-700 whitespace-nowrap pl-2">
                    +{currency} {b.service_price}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}