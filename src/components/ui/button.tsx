import { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";

type ButtonSize = "sm" | "md" | "lg" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[#A88042] text-white shadow-lg shadow-[#A88042]/25 hover:bg-[#8F6D37]",
  secondary: "bg-black text-white shadow-lg shadow-black/15 hover:bg-[#4B4B4B]",
  outline:
    "border border-black/10 bg-white text-[#4B4B4B] hover:border-[#A88042]/60 hover:text-[#A88042]",
  ghost: "bg-transparent text-[#4B4B4B] hover:bg-black/5 hover:text-black",
  danger: "bg-red-600 text-white shadow-lg shadow-red-600/20 hover:bg-red-700",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 rounded-xl px-3 text-xs",
  md: "h-11 rounded-2xl px-5 text-sm",
  lg: "h-13 rounded-2xl px-6 text-base",
  icon: "h-11 w-11 rounded-2xl p-0",
};

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-extrabold transition disabled:cursor-not-allowed disabled:opacity-60",
        "focus:outline-none focus:ring-4 focus:ring-[#A88042]/15",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {isLoading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  );
}
