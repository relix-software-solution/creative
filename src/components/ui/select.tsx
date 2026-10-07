"use client";

import { Check, ChevronDown } from "lucide-react";
import {
  CSSProperties,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
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
  required?: boolean;
  onChange: (value: string) => void;
  className?: string;
  accentColor?: string;
  textColor?: string;
  borderRadius?: string;
  triggerStyle?: CSSProperties;
};

type DropdownPosition = {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
};

export function Select({
  label,
  placeholder = "اختر قيمة",
  value,
  options,
  error,
  disabled = false,
  required = false,
  onChange,
  className,
  accentColor = "#A88042",
  textColor = "#4B4B4B",
  borderRadius = "1rem",
  triggerStyle,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<DropdownPosition>({
    top: 0,
    left: 0,
    width: 0,
    maxHeight: 256,
  });

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMounted(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  function updatePosition() {
    const button = buttonRef.current;

    if (!button) return;

    const rect = button.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const edgeGap = 8;
    const dropdownGap = 8;
    const preferredHeight = 256;
    const minimumUsefulHeight = 160;
    const spaceBelow = Math.max(0, viewportHeight - rect.bottom - edgeGap);
    const spaceAbove = Math.max(0, rect.top - edgeGap);
    const openBelow =
      spaceBelow >= minimumUsefulHeight || spaceBelow >= spaceAbove;
    const availableHeight = openBelow ? spaceBelow : spaceAbove;
    const width = Math.min(rect.width, Math.max(0, viewportWidth - edgeGap * 2));
    const left = Math.min(
      Math.max(edgeGap, rect.left),
      Math.max(edgeGap, viewportWidth - width - edgeGap),
    );

    setPosition({
      ...(openBelow
        ? { top: rect.bottom + dropdownGap, bottom: undefined }
        : {
            top: undefined,
            bottom: viewportHeight - rect.top + dropdownGap,
          }),
      left,
      width,
      maxHeight: Math.max(
        96,
        Math.min(preferredHeight, availableHeight - dropdownGap),
      ),
    });
  }

  useLayoutEffect(() => {
    if (!open) return;

    updatePosition();
  }, [open, value, options.length]);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      const clickedInsideWrapper = wrapperRef.current?.contains(target);
      const clickedInsideDropdown = dropdownRef.current?.contains(target);

      if (!clickedInsideWrapper && !clickedInsideDropdown) {
        setOpen(false);
      }
    }

    function handlePositionUpdate() {
      updatePosition();
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("resize", handlePositionUpdate);
    window.addEventListener("scroll", handlePositionUpdate, true);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", handlePositionUpdate);
      window.removeEventListener("scroll", handlePositionUpdate, true);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  function handleSelect(option: SelectOption) {
    if (option.disabled) return;

    onChange(option.value);
    setOpen(false);
  }

  const dropdown =
    mounted && open
      ? createPortal(
          <div
            ref={dropdownRef}
            role="listbox"
            style={{
              top: position.top,
              bottom: position.bottom,
              left: position.left,
              width: position.width,
              maxHeight: position.maxHeight,
              zIndex: 999999,
              borderRadius,
            }}
            className="fixed overflow-hidden border border-black/10 bg-white shadow-[0_24px_70px_rgba(0,0,0,0.14)]"
          >
            <div
              className="custom-scrollbar overflow-y-auto p-2"
              style={{ maxHeight: position.maxHeight }}
            >
              {options.map((option) => {
                const isSelected = option.value === value;

                return (
                  <button
                    key={option.value || option.label}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={option.disabled}
                    onClick={() => handleSelect(option)}
                    style={{
                      backgroundColor: isSelected ? accentColor : undefined,
                      color: isSelected ? "#FFFFFF" : textColor,
                      borderRadius: `min(${borderRadius}, 0.75rem)`,
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 px-3 py-3 text-right text-sm font-extrabold transition",
                      !isSelected && !option.disabled
                        ? "hover:bg-black/[0.04]"
                        : "",
                      option.disabled ? "cursor-not-allowed opacity-45" : "",
                    )}
                  >
                    <span className="truncate">{option.label}</span>

                    {isSelected ? <Check className="h-4 w-4 shrink-0" /> : null}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={wrapperRef} className={cn("relative space-y-2", className)}>
      {label ? (
        <label className="text-sm font-extrabold text-[#4B4B4B]">{label}</label>
      ) : null}

      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-invalid={Boolean(error)}
        aria-required={required}
        onClick={() => {
          if (disabled) return;

          updatePosition();
          setOpen((value) => !value);
        }}
        style={{
          borderRadius,
          color: textColor,
          borderColor: error
            ? "#F87171"
            : open
              ? accentColor
              : triggerStyle?.borderColor,
          boxShadow:
            open && !error ? `0 0 0 4px ${accentColor}1A` : undefined,
          ...triggerStyle,
        }}
        className={cn(
          "flex h-12 w-full items-center justify-between gap-3 border bg-white px-4 text-sm font-extrabold outline-none transition",
          disabled
            ? "cursor-not-allowed border-black/10 bg-black/[0.03] opacity-45"
            : "border-black/10 hover:border-black/20",
          error ? "border-red-400" : "",
        )}
      >
        <span className={cn("truncate", selectedOption ? "" : "opacity-40")}>
          {selectedOption?.label ?? placeholder}
        </span>

        <ChevronDown
          style={{ color: accentColor }}
          className={cn(
            "h-5 w-5 shrink-0 transition",
            open ? "rotate-180" : "",
          )}
        />
      </button>

      {dropdown}

      {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}
    </div>
  );
}
