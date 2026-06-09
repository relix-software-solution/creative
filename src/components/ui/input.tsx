import { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  icon?: ReactNode;
};

export function Input({
  label,
  error,
  icon,
  className,
  id,
  ...props
}: InputProps) {
  return (
    <div className="space-y-2">
      {label ? (
        <label htmlFor={id} className="text-sm font-bold text-[#4B4B4B]">
          {label}
        </label>
      ) : null}

      <div className="relative">
        {icon ? (
          <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#4B4B4B]/45">
            {icon}
          </div>
        ) : null}

        <input
          id={id}
          className={cn(
            "h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm text-[#4B4B4B] outline-none transition",
            "placeholder:text-[#4B4B4B]/40 focus:border-[#A88042] focus:ring-4 focus:ring-[#A88042]/10",
            icon ? "pr-12" : "",
            error
              ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
              : "",
            className,
          )}
          {...props}
        />
      </div>

      {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}
    </div>
  );
}
