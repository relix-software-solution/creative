"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

export type SelectOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

type SelectProps = {
  label?: string;
  placeholder?: string;
  value?: string;
  options: SelectOption[];
  error?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  className?: string;
};

export function Select({
  label,
  placeholder = "اختر قيمة",
  value,
  options,
  error,
  disabled = false,
  onChange,
  className,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function handleSelect(option: SelectOption) {
    if (option.disabled) return;

    onChange(option.value);
    setOpen(false);
  }

  return (
    <div ref={wrapperRef} className={cn("relative space-y-2", className)}>
      {label ? (
        <label className="text-sm font-extrabold text-[#4B4B4B]">{label}</label>
      ) : null}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex h-12 w-full items-center justify-between gap-3 rounded-2xl border bg-white px-4 text-sm font-extrabold outline-none transition",
          "focus:border-[#A88042] focus:ring-4 focus:ring-[#A88042]/10",
          disabled
            ? "cursor-not-allowed border-black/10 bg-black/[0.03] text-[#4B4B4B]/40"
            : "border-black/10 text-[#4B4B4B] hover:border-[#A88042]/50",
          error
            ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
            : "",
        )}
      >
        <span
          className={cn(
            "truncate",
            selectedOption ? "text-[#4B4B4B]" : "text-[#4B4B4B]/38",
          )}
        >
          {selectedOption?.label ?? placeholder}
        </span>

        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-[#A88042] transition",
            open ? "rotate-180" : "",
          )}
        />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-full overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_24px_70px_rgba(0,0,0,0.14)]">
          <div className="custom-scrollbar max-h-64 overflow-y-auto p-2">
            {options.map((option) => {
              const isSelected = option.value === value;

              return (
                <button
                  key={option.value || option.label}
                  type="button"
                  disabled={option.disabled}
                  onClick={() => handleSelect(option)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-right text-sm font-extrabold transition",
                    isSelected
                      ? "bg-[#A88042] text-white"
                      : "text-[#4B4B4B] hover:bg-[#A88042]/8 hover:text-[#A88042]",
                    option.disabled
                      ? "cursor-not-allowed opacity-45 hover:bg-transparent hover:text-[#4B4B4B]"
                      : "",
                  )}
                >
                  <span className="truncate">{option.label}</span>

                  {isSelected ? <Check className="h-4 w-4 shrink-0" /> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}
    </div>
  );
}
