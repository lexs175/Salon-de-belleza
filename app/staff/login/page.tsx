"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, KeyRound, Loader2, Sparkles } from "lucide-react";

export default function StaffLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Credenciales incorrectas.");
      }

      router.push("/staff");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-900 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Luces de fondo decorativas */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-rose-500/20 rounded-[4px] blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-amber-500/20 rounded-[4px] blur-3xl pointer-events-none" />

      {/* Tarjeta principal */}
      <div className="w-full max-w-sm bg-stone-850/90 border border-stone-800 rounded-[4px] p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative z-10 space-y-6">
        {/* Cabecera */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-tr from-rose-500 to-amber-400 rounded-[4px] flex items-center justify-center mx-auto shadow-lg shadow-rose-500/30">
            <Sparkles className="text-white" size={26} />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Portal del Especialista
          </h1>
          <p className="text-xs text-stone-400">
            Ingresa con tu correo y contraseña para ver tu agenda de turnos.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-[4px] p-3 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              Correo electrónico
            </label>
            <input
              type="email"
              required
              autoFocus
              placeholder="camila@salon.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-[4px] border border-stone-700 bg-stone-900/80 px-4 py-3 text-sm text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-[4px] border border-stone-700 bg-stone-900/80 px-4 py-3 text-sm text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-[4px] bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-bold text-sm shadow-lg shadow-rose-600/30 transition-all inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                <KeyRound size={16} />
                <span>Ingresar a mi portal</span>
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-300 transition-colors"
          >
            <ArrowLeft size={13} />
            <span>Volver a la web del salón</span>
          </a>
        </div>
      </div>
    </div>
  );
}
