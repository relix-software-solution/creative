"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "./button";

type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  className?: string;
};

export function Modal({
  open,
  title,
  description,
  children,
  footer,
  onClose,
  className,
}: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="إغلاق"
        onClick={onClose}
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
      />

      <div
        className={cn(
          "relative z-10 w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/20 bg-white shadow-[0_30px_90px_rgba(0,0,0,0.28)]",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-black/10 p-6">
          <div>
            <h2 className="text-xl font-extrabold text-[#4B4B4B]">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm leading-6 text-[#4B4B4B]/65">
                {description}
              </p>
            ) : null}
          </div>

          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-6">{children}</div>

        {footer ? (
          <div className="flex flex-wrap justify-end gap-3 border-t border-black/10 bg-[#F8F8FF] p-5">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
