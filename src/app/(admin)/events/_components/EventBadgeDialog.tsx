"use client";

import { useEffect } from "react";
import { Loader2, Save, X } from "lucide-react";
import { BadgeAvailableField, EventItem } from "@/features/events/events.types";
import { Button } from "@/components/ui/button";
import { BadgeState, EventBadgeSection } from "./EventBadgeSection";
import {
  ImageChangeHandler,
  ImageRemoveHandler,
} from "../_lib/events-page.types";

export function EventBadgeDialog({
  open,
  event,
  badge,
  availableFields,
  isLoading,
  isSubmitting,
  onClose,
  onSave,
  onImageChange,
  onImageRemove,
}: {
  open: boolean;
  event: EventItem | null;
  badge: BadgeState;
  availableFields: BadgeAvailableField[];
  isLoading: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSave: () => void;
  onImageChange: ImageChangeHandler;
  onImageRemove: ImageRemoveHandler;
}) {
  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      dir="rtl"
    >
      <div
        className="flex overflow-hidden rounded-3xl border border-white/20 bg-white shadow-[0_30px_90px_rgba(0,0,0,0.28)]"
        style={{
          width: "min(1120px, 94vw)",
          height: "min(650px, 88vh)",
          flexDirection: "column",
        }}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-black/10 px-5 py-4">
          <div className="text-right">
            <h2 className="text-xl font-extrabold text-[#4B4B4B]">
              إعداد قالب البادج
            </h2>

            <p className="mt-1 text-sm font-bold leading-6 text-[#4B4B4B]/55">
              {event
                ? `تحكم بتصميم البادج الخاص بفعالية: ${event.titleAr}`
                : "تحكم بتصميم البادج الخاص بالفعالية."}
            </p>
          </div>

          <Button variant="ghost" size="icon" onClick={onClose}>
            {" "}
            <X className="h-5 w-5" />{" "}
          </Button>
        </header>

        <div className="min-h-0 flex-1 overflow-hidden p-4">
          {isLoading ? (
            <div className="flex h-full items-center justify-center rounded-3xl border border-black/10 bg-[#F8F8FF]">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#A88042]" />
                <p className="mt-3 text-sm font-bold text-[#4B4B4B]/60">
                  جاري تحميل إعدادات البادج...
                </p>
              </div>
            </div>
          ) : (
            <EventBadgeSection
              badge={badge}
              availableFields={availableFields}
              isSubmitting={isSubmitting}
              onImageChange={onImageChange}
              onImageRemove={onImageRemove}
            />
          )}
        </div>

        <footer className="flex shrink-0 items-center justify-end gap-3 border-t border-black/10 bg-[#F8F8FF] px-5 py-4">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            <X className="h-4 w-4" />
            إغلاق
          </Button>

          <Button onClick={onSave} disabled={isSubmitting || !event}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            حفظ قالب البادج
          </Button>
        </footer>
      </div>
    </div>
  );
}
