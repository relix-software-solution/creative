import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type BadgeVariant =
  | "gold"
  | "black"
  | "success"
  | "warning"
  | "danger"
  | "muted";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  variant?: BadgeVariant;
};

const variants: Record<BadgeVariant, string> = {
  gold: "bg-[#A88042]/10 text-[#A88042] ring-[#A88042]/20",
  black: "bg-black text-white ring-black/10",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  danger: "bg-red-50 text-red-700 ring-red-200",
  muted: "bg-[#4B4B4B]/8 text-[#4B4B4B] ring-black/10",
};

export function Badge({
  children,
  className,
  variant = "gold",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-extrabold ring-1",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
