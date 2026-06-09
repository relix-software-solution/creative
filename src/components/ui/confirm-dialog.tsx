"use client";

import { AlertTriangle, CheckCircle2, Info, Trash2 } from "lucide-react";
import { Modal } from "./modal";
import { Button } from "./button";

type ConfirmVariant = "gold" | "danger" | "success" | "info";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

const variantConfig = {
  gold: {
    icon: AlertTriangle,
    iconClass: "bg-[#A88042]/10 text-[#A88042]",
    buttonVariant: "primary" as const,
  },
  danger: {
    icon: Trash2,
    iconClass: "bg-red-50 text-red-600",
    buttonVariant: "danger" as const,
  },
  success: {
    icon: CheckCircle2,
    iconClass: "bg-emerald-50 text-emerald-600",
    buttonVariant: "primary" as const,
  },
  info: {
    icon: Info,
    iconClass: "bg-black/5 text-[#4B4B4B]",
    buttonVariant: "secondary" as const,
  },
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "تأكيد",
  cancelText = "إلغاء",
  variant = "gold",
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <Modal
      open={open}
      onClose={isLoading ? () => {} : onClose}
      title={title}
      description={description}
      className="max-w-md"
      closeOnBackdrop={!isLoading}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={config.buttonVariant}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${config.iconClass}`}
        >
          <Icon className="h-6 w-6" />
        </div>

        <div>
          <p className="text-sm font-extrabold text-[#4B4B4B]">
            يرجى التأكد قبل المتابعة
          </p>
          <p className="mt-2 text-sm font-bold leading-7 text-[#4B4B4B]/60">
            هذا الإجراء سيتم تنفيذه مباشرة بعد الضغط على زر التأكيد.
          </p>
        </div>
      </div>
    </Modal>
  );
}
