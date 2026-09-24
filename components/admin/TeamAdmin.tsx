"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Camera,
  Check,
  Edit2,
  KeyRound,
  Link2,
  Loader2,
  Phone,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  UserCheck,
  UserX,
  Users,
  X,
} from "lucide-react";
import type { Service, StaffMember } from "@/lib/types";
import { showToast } from "./toast";
import PhoneInput from "@/components/PhoneInput";

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces",
];

export default function TeamAdmin() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // Form
  const [formName, setFormName] = useState("");
  const [formRole, setFormRole] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formAvatar, setFormAvatar] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");

  // Avatar upload
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/staff").then((r) => r.json()),
      fetch("/api/admin/services").then((r) => r.json()),
    ])
      .then(([staffData, serviceData]) => {
        setStaff(staffData.staff || []);
        setServices(serviceData.services || []);
      })
      .catch(() => showToast("Error al cargar datos del equipo.", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  function openCreateModal() {
    setEditingStaff(null);
    setFormName("");
    setFormRole("");
    setFormPhone("");
    setFormAvatar(AVATAR_PRESETS[staff.length % AVATAR_PRESETS.length]);
    setFormActive(true);
    setFormEmail("");
    setFormPassword("");
    // Por defecto todos los servicios
    setSelectedServices(services.map((s) => s.id));
    setShowUrlInput(false);
    setUrlDraft("");
    setUploadingAvatar(false);
    setDragOver(false);
    setModalOpen(true);
  }

  function openEditModal(member: StaffMember) {
    setEditingStaff(member);
    setFormName(member.name);
    setFormRole(member.role);
    setFormPhone(member.phone || "");
    setFormAvatar(member.avatar || "");
    setFormActive(Boolean(member.active));
    setSelectedServices(member.services || []);
    setFormEmail(member.email || "");
    setFormPassword("");
    setShowUrlInput(false);
    setUrlDraft(member.avatar || "");
    setUploadingAvatar(false);
    setDragOver(false);
    setModalOpen(true);
  }

  async function handleAvatarUpload(file: File) {
    const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    if (file.size > MAX_BYTES) {
      showToast("La foto supera los 8 MB. Por favor elige una imagen más ligera.", "error");
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      showToast("Formato no válido. Solo se permiten imágenes JPG, PNG o WEBP.", "error");
      return;
    }

    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "team");

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Error al subir la imagen.", "error");
        return;
      }

      setFormAvatar(data.url);
      setUrlDraft(data.url);
      showToast("Foto subida correctamente.", "success");
    } catch {
      showToast("Error de conexión al subir la foto.", "error");
    } finally {
      setUploadingAvatar(false);
    }
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleAvatarUpload(file);
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          handleAvatarUpload(file);
          break;
        }
      }
    }
  }

  function toggleService(serviceId: number) {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim() || !formRole.trim()) {
      showToast("Nombre y rol son requeridos.", "error");
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, any> = {
        name: formName.trim(),
        role: formRole.trim(),
        phone: formPhone.trim(),
        avatar: formAvatar.trim(),
        active: formActive ? 1 : 0,
        services: selectedServices,
      };
      if (formEmail.trim()) {
        payload.email = formEmail.trim().toLowerCase();
      }
      if (formPassword) {
        payload.password = formPassword;
      }

      if (editingStaff) {
        const res = await fetch(`/api/admin/staff/${editingStaff.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        showToast("Especialista actualizado con éxito.", "success");
      } else {
        const res = await fetch("/api/admin/staff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        showToast("Nuevo profesional añadido al equipo.", "success");
      }

      setModalOpen(false);
      loadData();
    } catch {
      showToast("Error al guardar especialista.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(member: StaffMember) {
    const newStatus = member.active ? 0 : 1;
    try {
      await fetch(`/api/admin/staff/${member.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...member, active: newStatus }),
      });
      showToast(
        member.active ? "Profesional pausado." : "Profesional activado.",
        "success"
      );
      loadData();
    } catch {
      showToast("Error al cambiar estado.", "error");
    }
  }

  async function handleDelete(id: number) {
    try {
      await fetch(`/api/admin/staff/${id}`, { method: "DELETE" });
      showToast("Especialista eliminado.", "success");
      setConfirmDeleteId(null);
      loadData();
    } catch {
      showToast("Error al eliminar.", "error");
    }
  }

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-[4px] border border-stone-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              Equipo y Especialistas
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-[4px]">
              <span className="w-1.5 h-1.5 rounded-[4px] bg-emerald-600" />
              {staff.filter((s) => s.active).length} activos
            </span>
          </div>
          <p className="text-sm text-stone-500 mt-0.5">
            Gestiona estilistas, especialidades y permite citas simultáneas a la misma hora
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 bg-[#007356] hover:bg-[#005c44] text-white text-xs font-semibold px-4 py-2.5 rounded-[4px] shadow-sm transition-colors cursor-pointer"
        >
          <Plus size={16} />
          <span>+ Nuevo Profesional</span>
        </button>
      </div>

      {/* Grid de miembros del equipo */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 text-stone-400">
          <Loader2 className="animate-spin text-[#007356] mb-3" size={32} />
          <p className="text-sm">Cargando equipo…</p>
        </div>
      ) : staff.length === 0 ? (
        <div className="bg-white rounded-[4px] border border-dashed border-stone-300 p-12 text-center">
          <div className="w-12 h-12 rounded-[4px] bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3">
            <Users size={24} />
          </div>
          <h3 className="text-base font-bold text-stone-800">No hay profesionales registrados</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 mb-4">
            Añade a los miembros de tu salón para asignar especialidades y permitir que varias clientas reserven al mismo tiempo.
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 bg-[#007356] text-white text-xs font-semibold px-4 py-2 rounded-[4px]"
          >
            <Plus size={14} />
            <span>Añadir primer estilista</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {staff.map((member) => {
            const memberServiceNames = services
              .filter((s) => !member.services || member.services.length === 0 || member.services.includes(s.id))
              .map((s) => s.name);

            return (
              <div
                key={member.id}
                className={`bg-white rounded-[4px] border p-5 shadow-xs flex flex-col justify-between transition-all ${
                  member.active ? "border-stone-200/80" : "border-stone-200 opacity-60 bg-stone-50/50"
                }`}
              >
                <div>
                  {/* Top info */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-[4px] overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                        {member.avatar ? (
                          <Image
                            src={member.avatar}
                            alt={member.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-brand/20 text-brand-deep font-bold text-base">
                            {member.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-stone-900 leading-tight">{member.name}</h3>
                        <p className="text-xs text-[#007356] font-semibold mt-0.5">{member.role}</p>
                      </div>
                    </div>

                    <span
                      onClick={() => toggleStatus(member)}
                      className={`cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-[4px] border transition-colors ${
                        member.active
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                          : "bg-stone-100 text-stone-500 border-stone-200 hover:bg-stone-200"
                      }`}
                      title={member.active ? "Click para pausar" : "Click para activar"}
                    >
                      {member.active ? "Activo" : "Pausado"}
                    </span>
                  </div>

                  {member.phone && (
                    <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-3">
                      <Phone size={12} />
                      <span>{member.phone}</span>
                    </div>
                  )}

                  {/* Servicios que atiende */}
                  <div className="space-y-1.5 mb-4">
                    <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                      Servicios asignados ({memberServiceNames.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {memberServiceNames.length === 0 ? (
                        <span className="text-xs text-stone-400 italic">Todos los servicios</span>
                      ) : (
                        memberServiceNames.map((name) => (
                          <span
                            key={name}
                            className="text-[11px] font-medium bg-stone-100 text-stone-700 px-2 py-0.5 rounded-[4px]"
                          >
                            {name}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Acciones de la tarjeta */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(member)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-stone-700 hover:text-[#007356] p-1.5 rounded-[4px] hover:bg-stone-100 transition-colors cursor-pointer"
                    >
                      <Edit2 size={13} />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => toggleStatus(member)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-stone-800 p-1.5 rounded-[4px] hover:bg-stone-100 transition-colors cursor-pointer"
                    >
                      {member.active ? (
                        <>
                          <UserX size={13} />
                          <span>Pausar</span>
                        </>
                      ) : (
                        <>
                          <UserCheck size={13} />
                          <span>Activar</span>
                        </>
                      )}
                    </button>
                  </div>

                  {confirmDeleteId === member.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(member.id)}
                        className="text-[11px] bg-red-600 text-white px-2 py-1 rounded-[4px] font-bold"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-[11px] text-stone-500 px-1 py-1"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(member.id)}
                      aria-label="Eliminar"
                      className="p-1.5 text-stone-400 hover:text-red-600 rounded-[4px] hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Crear / Editar Especialista */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
          <div
            className="bg-white rounded-[4px] border border-stone-200/90 shadow-2xl max-w-4xl w-full p-6 sm:p-8 my-auto animate-in fade-in zoom-in-95 duration-200 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header modal */}
            <div className="flex items-start justify-between border-b border-stone-100 pb-4">
              <div>
                <span className="text-xs font-bold text-[#007356] uppercase tracking-wider">
                  Equipo del Salón
                </span>
                <h3 className="text-2xl font-bold text-stone-900 mt-1">
                  {editingStaff ? "Editar especialista" : "Nuevo profesional"}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Configura los datos del profesional y asigna qué servicios puede realizar.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 text-stone-400 hover:text-stone-700 rounded-[4px] hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} onPaste={handlePaste} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                {/* COLUMNA IZQUIERDA: DATOS PERSONALES Y FOTO */}
                <div className="lg:col-span-5 space-y-4">
                  <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                    Información personal
                  </h4>

                  {/* Nombre */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Nombre completo *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Camila Morales"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full rounded-[4px] border border-stone-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#007356]"
                    />
                  </div>

                  {/* Rol o especialidad */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Rol / Cargo / Especialidad *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Master Colorista, Maquilladora Pro, Estilista"
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value)}
                      className="w-full rounded-[4px] border border-stone-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#007356]"
                    />
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Teléfono / WhatsApp (Opcional)
                    </label>
                    <PhoneInput
                      value={formPhone}
                      onChange={setFormPhone}
                      variant="admin"
                      placeholder="70011223"
                    />
                  </div>

                  {/* Foto de perfil */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-stone-700">
                        Foto de perfil
                      </label>
                      <span className="text-[10px] text-stone-400 font-medium">
                        JPG, PNG o WEBP · Máx 8 MB
                      </span>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleAvatarUpload(file);
                        e.target.value = "";
                      }}
                    />

                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                      }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleFileDrop}
                      className={`p-3 rounded-[4px] border transition-all ${
                        dragOver
                          ? "border-[#007356] bg-emerald-50/60 ring-2 ring-[#007356]/20"
                          : "border-stone-200 bg-stone-50/70 hover:bg-stone-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Avatar preview / Clickable drop area */}
                        <div
                          onClick={() => !uploadingAvatar && fileInputRef.current?.click()}
                          title="Clic para subir o cambiar foto"
                          className="relative group w-16 h-16 rounded-[4px] overflow-hidden bg-stone-100 border border-stone-200 shrink-0 flex items-center justify-center font-bold text-stone-600 text-sm shadow-xs cursor-pointer hover:border-[#007356] transition-colors"
                        >
                          {formAvatar ? (
                            <img
                              src={formAvatar}
                              alt="Vista previa"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-stone-400">
                              <Camera size={20} className="text-stone-400 group-hover:text-[#007356] transition-colors" />
                              <span className="text-[9px] mt-0.5 font-medium">Subir</span>
                            </div>
                          )}

                          {uploadingAvatar && (
                            <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs flex flex-col items-center justify-center text-white">
                              <Loader2 size={18} className="animate-spin" />
                            </div>
                          )}

                          {!uploadingAvatar && formAvatar && (
                            <div className="absolute inset-0 bg-stone-900/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-[10px] font-medium">
                              <Camera size={14} className="mb-0.5" />
                              <span>Cambiar</span>
                            </div>
                          )}
                        </div>

                        {/* Botones de acción directos */}
                        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={uploadingAvatar}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#007356] hover:bg-[#005c44] disabled:bg-stone-300 text-white text-xs font-semibold rounded-[4px] transition-colors cursor-pointer shadow-xs"
                            >
                              {uploadingAvatar ? (
                                <>
                                  <Loader2 size={13} className="animate-spin" />
                                  <span>Subiendo foto…</span>
                                </>
                              ) : (
                                <>
                                  <Upload size={13} />
                                  <span>{formAvatar ? "Cambiar foto" : "Subir desde tu equipo"}</span>
                                </>
                              )}
                            </button>

                            {formAvatar && (
                              <button
                                type="button"
                                onClick={() => {
                                  setFormAvatar("");
                                  setUrlDraft("");
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-[4px] font-medium transition-colors cursor-pointer"
                              >
                                <Trash2 size={12} />
                                <span>Quitar</span>
                              </button>
                            )}
                          </div>

                          <p className="text-[11px] text-stone-500 leading-tight">
                            Arrastra una imagen aquí o pega con Ctrl+V.
                          </p>

                          {/* Toggle opcional para URL externa */}
                          <button
                            type="button"
                            onClick={() => setShowUrlInput(!showUrlInput)}
                            className="inline-flex items-center gap-1 text-[11px] text-[#007356] hover:underline font-medium cursor-pointer w-fit"
                          >
                            <Link2 size={11} />
                            <span>{showUrlInput ? "Ocultar opción de URL" : "O pegar enlace URL de imagen"}</span>
                          </button>
                        </div>
                      </div>

                      {/* Desplegable para URL externa si se prefiere */}
                      {showUrlInput && (
                        <div className="mt-3 pt-3 border-t border-stone-200/80 flex gap-2">
                          <input
                            type="url"
                            placeholder="https://images.unsplash.com/..."
                            value={urlDraft}
                            onChange={(e) => setUrlDraft(e.target.value)}
                            className="flex-1 rounded-[4px] border border-stone-300 px-3 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#007356]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (urlDraft.trim()) {
                                setFormAvatar(urlDraft.trim());
                                showToast("Foto asignada desde URL.", "success");
                              }
                            }}
                            className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold rounded-[4px] transition-colors cursor-pointer shrink-0"
                          >
                            Aplicar
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Fotos sugeridas rápidas */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[11px] text-stone-500 font-medium">Fotos sugeridas:</span>
                      <div className="flex gap-1.5">
                        {AVATAR_PRESETS.map((preset, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setFormAvatar(preset);
                              setUrlDraft(preset);
                            }}
                            className={`relative w-7 h-7 rounded-[4px] overflow-hidden border transition-all cursor-pointer ${
                              formAvatar === preset
                                ? "ring-2 ring-[#007356] scale-110"
                                : "opacity-70 hover:opacity-100"
                            }`}
                          >
                            <Image src={preset} alt="" fill sizes="28px" className="object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Tarjeta de estado activo */}
                  <label className="flex items-center justify-between p-3.5 rounded-[4px] border border-stone-200 bg-stone-50/80 hover:bg-stone-50 cursor-pointer transition-colors">
                    <div>
                      <p className="text-xs font-bold text-stone-800">Especialista activo</p>
                      <p className="text-[11px] text-stone-500">Disponible para agendar en la web pública</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formActive}
                      onChange={(e) => setFormActive(e.target.checked)}
                      className="rounded-[4px] text-[#007356] focus:ring-[#007356] w-4 h-4 cursor-pointer"
                    />
                  </label>

                  {/* Credenciales de Acceso para el Especialista */}
                  <div className="bg-stone-50/80 rounded-[4px] p-4 border border-stone-200/90 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                      <KeyRound size={14} className="text-[#007356]" />
                      <span>Acceso al Portal Móvil (/staff)</span>
                    </div>
                    <p className="text-[11px] text-stone-500 leading-relaxed">
                      Asigna un correo y contraseña para que esta estilista consulte sus citas del día desde su celular.
                    </p>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Correo de acceso
                      </label>
                      <input
                        type="email"
                        placeholder="ej. estilista@salon.com"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        className="w-full rounded-[4px] border border-stone-300 px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#007356]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        {editingStaff ? "Nueva contraseña (dejar en blanco para conservar)" : "Contraseña"}
                      </label>
                      <input
                        type="password"
                        placeholder={editingStaff ? "••••••••" : "Mínimo 4 caracteres"}
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        className="w-full rounded-[4px] border border-stone-300 px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#007356]"
                      />
                    </div>
                  </div>
                </div>

                {/* COLUMNA DERECHA: SELECCIÓN DE SERVICIOS EN GRID ESPACIOSO */}
                <div className="lg:col-span-7 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                        Servicios que atiende
                      </h4>
                      <p className="text-xs text-stone-500 mt-0.5">
                        <span className="font-bold text-[#007356]">{selectedServices.length}</span> de {services.length} seleccionados
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedServices(
                          selectedServices.length === services.length
                            ? []
                            : services.map((s) => s.id)
                        )
                      }
                      className="text-xs text-[#007356] font-semibold hover:underline cursor-pointer bg-emerald-50 px-2.5 py-1 rounded-[4px]"
                    >
                      {selectedServices.length === services.length ? "Deseleccionar todos" : "Seleccionar todos"}
                    </button>
                  </div>

                  {/* Grilla de servicios de 2 columnas con tarjetas espaciosas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto p-1 border border-stone-200/80 rounded-[4px] bg-stone-50/30 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {services.map((s) => {
                      const checked = selectedServices.includes(s.id);
                      return (
                        <div
                          key={s.id}
                          onClick={() => toggleService(s.id)}
                          className={`p-3 rounded-[4px] border text-xs font-medium cursor-pointer transition-all flex items-start gap-2.5 select-none ${
                            checked
                              ? "bg-emerald-50/60 border-emerald-300 text-emerald-950 shadow-2xs"
                              : "bg-white border-stone-200/90 text-stone-600 hover:border-stone-300 hover:bg-stone-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {}}
                            className="rounded-[4px] text-[#007356] focus:ring-[#007356] w-4 h-4 mt-0.5 pointer-events-none"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-stone-900 truncate leading-tight">{s.name}</p>
                            <div className="flex items-center justify-between gap-1 mt-1 text-[11px]">
                              <span className="text-stone-500">{s.duration_minutes} min</span>
                              <span className="font-bold text-[#007356]">Bs. {s.price}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 border border-stone-300 hover:bg-stone-100 text-stone-700 font-semibold rounded-[4px] text-sm transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-[#007356] hover:bg-[#005c44] disabled:opacity-50 text-white font-semibold rounded-[4px] text-sm transition-colors inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Guardando…</span>
                    </>
                  ) : (
                    <span>{editingStaff ? "Guardar cambios" : "Crear especialista"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
