"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, Mail, ShieldCheck } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("admin@salon.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo iniciar sesión.");
        setLoading(false);
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Error de conexión.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-[4px] border border-stone-200/90 shadow-xl p-8 sm:p-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-stone-900 rounded-[4px] flex items-center justify-center mx-auto shadow-md">
              <ShieldCheck className="text-rose-400" size={28} />
            </div>
            <h1 className="font-serif text-2xl font-bold text-stone-900 tracking-tight">
              Panel de Administración
            </h1>
            <p className="text-xs text-stone-500">
              Ingresa con tus credenciales de administrador
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Correo electrónico
              </label>
              <div className="flex items-stretch rounded-[4px] border border-stone-300 bg-white focus-within:border-[#007356] focus-within:ring-2 focus-within:ring-[#007356]/30 transition-all overflow-hidden">
                <span className="flex items-center px-3.5 bg-stone-100/90 border-r border-stone-200 text-stone-400 shrink-0 select-none">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@salon.com"
                  className="w-full bg-transparent px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Contraseña
              </label>
              <div className="flex items-stretch rounded-[4px] border border-stone-300 bg-white focus-within:border-[#007356] focus-within:ring-2 focus-within:ring-[#007356]/30 transition-all overflow-hidden">
                <span className="flex items-center px-3.5 bg-stone-100/90 border-r border-stone-200 text-stone-400 shrink-0 select-none">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoFocus
                  className="w-full bg-transparent px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none"
                  required
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-[4px] px-4 py-3 font-medium">
                {error}
              </p>
            )}

            <button
              disabled={loading}
              className="w-full bg-[#007356] hover:bg-[#005c44] disabled:bg-stone-300 text-white font-bold py-3.5 rounded-[4px] transition-colors cursor-pointer shadow-sm text-sm"
            >
              {loading ? "Iniciando sesión…" : "Entrar al panel"}
            </button>
          </form>

          <div className="pt-2 text-center border-t border-stone-100">
            <a
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 transition-colors"
            >
              <ArrowLeft size={13} />
              <span>Volver a la web del salón</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}