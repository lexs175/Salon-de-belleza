"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Phone } from "lucide-react";

export interface CountryInfo {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  placeholder: string;
  example: string;
}

export const COUNTRIES: CountryInfo[] = [
  {
    code: "BO",
    name: "Bolivia",
    dialCode: "+591",
    flag: "🇧🇴",
    placeholder: "71234567",
    example: "71234567",
  },
  {
    code: "AR",
    name: "Argentina",
    dialCode: "+54",
    flag: "🇦🇷",
    placeholder: "91123456789",
    example: "91123456789",
  },
  {
    code: "PE",
    name: "Perú",
    dialCode: "+51",
    flag: "🇵🇪",
    placeholder: "912345678",
    example: "912345678",
  },
  {
    code: "CL",
    name: "Chile",
    dialCode: "+56",
    flag: "🇨🇱",
    placeholder: "912345678",
    example: "912345678",
  },
  {
    code: "CO",
    name: "Colombia",
    dialCode: "+57",
    flag: "🇨🇴",
    placeholder: "3001234567",
    example: "3001234567",
  },
  {
    code: "BR",
    name: "Brasil",
    dialCode: "+55",
    flag: "🇧🇷",
    placeholder: "11912345678",
    example: "11912345678",
  },
  {
    code: "PY",
    name: "Paraguay",
    dialCode: "+595",
    flag: "🇵🇾",
    placeholder: "981123456",
    example: "981123456",
  },
  {
    code: "UY",
    name: "Uruguay",
    dialCode: "+598",
    flag: "🇺🇾",
    placeholder: "99123456",
    example: "99123456",
  },
  {
    code: "MX",
    name: "México",
    dialCode: "+52",
    flag: "🇲🇽",
    placeholder: "5512345678",
    example: "5512345678",
  },
  {
    code: "ES",
    name: "España",
    dialCode: "+34",
    flag: "🇪🇸",
    placeholder: "612345678",
    example: "612345678",
  },
  {
    code: "US",
    name: "Estados Unidos",
    dialCode: "+1",
    flag: "🇺🇸",
    placeholder: "2025550123",
    example: "2025550123",
  },
  {
    code: "EC",
    name: "Ecuador",
    dialCode: "+593",
    flag: "🇪🇨",
    placeholder: "991234567",
    example: "991234567",
  },
  {
    code: "VE",
    name: "Venezuela",
    dialCode: "+58",
    flag: "🇻🇪",
    placeholder: "4121234567",
    example: "4121234567",
  },
];

interface PhoneInputProps {
  value: string;
  onChange: (fullValue: string) => void;
  required?: boolean;
  disabled?: boolean;
  variant?: "public" | "admin";
  placeholder?: string;
  id?: string;
  name?: string;
}

export default function PhoneInput({
  value,
  onChange,
  required = false,
  disabled = false,
  variant = "public",
  placeholder,
  id,
  name,
}: PhoneInputProps) {
  // Descomponer el número entrante en código de país y número nacional
  const parsed = useMemo(() => {
    const trimmed = (value || "").trim();
    if (!trimmed) {
      return { country: null, nationalNumber: "" };
    }

    // Buscar si empieza por algún dialCode conocido (ordenados por longitud descendente)
    const sortedCountries = [...COUNTRIES].sort(
      (a, b) => b.dialCode.length - a.dialCode.length
    );
    for (const c of sortedCountries) {
      if (trimmed.startsWith(c.dialCode)) {
        const remaining = trimmed.slice(c.dialCode.length).replace(/\D/g, "");
        return { country: c, nationalNumber: remaining };
      }
    }

    // Si no coincide con dialCode, solo dígitos
    const onlyDigits = trimmed.replace(/\D/g, "");
    return { country: null, nationalNumber: onlyDigits };
  }, [value]);

  const [selectedCountry, setSelectedCountry] = useState<CountryInfo>(
    parsed.country || COUNTRIES[0]
  );
  const [nationalNumber, setNationalNumber] = useState<string>(
    parsed.nationalNumber
  );

  // Sincronizar si cambia el valor externamente
  useEffect(() => {
    if (parsed.country) {
      setSelectedCountry(parsed.country);
    }
    setNationalNumber(parsed.nationalNumber);
  }, [parsed]);

  function handleCountryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const code = e.target.value;
    const country = COUNTRIES.find((c) => c.code === code) || COUNTRIES[0];
    setSelectedCountry(country);
    if (nationalNumber) {
      onChange(`${country.dialCode} ${nationalNumber}`);
    }
  }

  function handleNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    // FILTRO ESTRICTO: Solo números permitidos
    const onlyDigits = e.target.value.replace(/\D/g, "");
    setNationalNumber(onlyDigits);
    if (onlyDigits) {
      onChange(`${selectedCountry.dialCode} ${onlyDigits}`);
    } else {
      onChange("");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // Permitir teclas de navegación y control
    if (
      e.key === "Backspace" ||
      e.key === "Delete" ||
      e.key === "Tab" ||
      e.key === "Escape" ||
      e.key === "Enter" ||
      e.key === "ArrowLeft" ||
      e.key === "ArrowRight" ||
      e.key === "ArrowUp" ||
      e.key === "ArrowDown" ||
      e.key === "Home" ||
      e.key === "End" ||
      e.ctrlKey ||
      e.metaKey
    ) {
      return;
    }

    // Bloquear explícitamente cualquier letra o símbolo no numérico
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").trim();
    if (!pasted) return;

    let targetCountry = selectedCountry;
    let cleanDigits = pasted.replace(/\D/g, "");

    const sortedCountries = [...COUNTRIES].sort(
      (a, b) => b.dialCode.length - a.dialCode.length
    );

    // Si pegan con '+' (ej: +59171234567 o +54 9 11...)
    if (pasted.startsWith("+")) {
      for (const c of sortedCountries) {
        if (pasted.startsWith(c.dialCode)) {
          targetCountry = c;
          cleanDigits = pasted.slice(c.dialCode.length).replace(/\D/g, "");
          break;
        }
      }
    } else {
      // Verificar si pegaron con el código sin el '+' (ej: 59171234567)
      for (const c of sortedCountries) {
        const rawCode = c.dialCode.replace(/\D/g, "");
        if (cleanDigits.startsWith(rawCode) && cleanDigits.length >= rawCode.length + 6) {
          targetCountry = c;
          cleanDigits = cleanDigits.slice(rawCode.length);
          break;
        }
      }
    }

    setSelectedCountry(targetCountry);
    setNationalNumber(cleanDigits);
    if (cleanDigits) {
      onChange(`${targetCountry.dialCode} ${cleanDigits}`);
    } else {
      onChange("");
    }
  }

  const isPublic = variant === "public";

  return (
    <div
      className={`flex items-stretch rounded-[4px] border transition-all overflow-hidden ${
        isPublic
          ? "border-stone-300 bg-ivory/50 focus-within:border-stone-500 focus-within:ring-2 focus-within:ring-rose-800/40"
          : "border-stone-300 bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-[#007356]/30"
      }`}
    >
      {/* Selector de País con Bandera */}
      <div className="relative flex items-center bg-stone-100/90 border-r border-stone-300 px-2.5 sm:px-3 text-stone-800 shrink-0 hover:bg-stone-200/70 transition-colors">
        <span className="text-lg leading-none select-none mr-1.5" aria-hidden="true">
          {selectedCountry.flag}
        </span>
        <span className="text-xs sm:text-sm font-semibold tracking-tight text-stone-700 font-mono">
          {selectedCountry.dialCode}
        </span>
        <ChevronDown size={14} className="text-stone-400 ml-1 shrink-0" />
        <select
          value={selectedCountry.code}
          onChange={handleCountryChange}
          disabled={disabled}
          title="Selecciona tu país"
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.name} ({c.dialCode})
            </option>
          ))}
        </select>
      </div>

      {/* Input de Número (SOLO DÍGITOS) */}
      <div className="relative flex-1 flex items-center">
        <input
          id={id}
          name={name}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          value={nationalNumber}
          onChange={handleNumberChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={placeholder || selectedCountry.placeholder}
          required={required}
          disabled={disabled}
          className={`w-full bg-transparent px-3.5 py-3 text-sm sm:text-base font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none ${
            isPublic ? "py-3.5" : "py-2.5 text-sm"
          }`}
        />
        {nationalNumber && (
          <span className="absolute right-3 text-[11px] font-mono font-bold text-stone-400 select-none hidden sm:inline">
            {nationalNumber.length} dígitos
          </span>
        )}
      </div>
    </div>
  );
}
