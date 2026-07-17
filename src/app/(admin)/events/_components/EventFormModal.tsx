"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { EventFormValues } from "@/features/events/events.schema";
import { EventItem } from "@/features/events/events.types";
import {
  EventFormInstance,
  ImageChangeHandler,
  ImageRemoveHandler,
} from "../_lib/events-page.types";
import { EventBrandingSection } from "./EventBrandingSection";
import { EventInfoSection } from "./EventInfoSection";

export function EventFormModal({
  open,
  selectedEvent,
  form,
  clients,
  isSubmitting,
  isBrandingLoading,
  isDeletingBranding,
  hasPersistedBranding,
  logoPreview,
  backgroundPreview,
  onClose,
  onSubmit,
  onImageChange,
  onImageRemove,
  onDeleteBranding,
}: {
  open: boolean;
  selectedEvent: EventItem | null;
  form: EventFormInstance;
  clients: Array<{ id: string; name: string }>;
  isSubmitting: boolean;
  isBrandingLoading: boolean;
  isDeletingBranding: boolean;
  hasPersistedBranding: boolean;
  logoPreview: string;
  backgroundPreview: string;
  onClose: () => void;
  onSubmit: (values: EventFormValues) => void;
  onImageChange: ImageChangeHandler;
  onImageRemove: ImageRemoveHandler;
  onDeleteBranding: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={selectedEvent ? "تعديل الفعالية" : "إضافة فعالية جديدة"}
      description={
        selectedEvent
          ? "عدّل معلومات الفعالية أو استبدل الهوية البصرية."
          : "أدخل بيانات الفعالية. الشعار وصورة الخلفية اختياريان."
      }
      className="max-w-3xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            إلغاء
          </Button>

          <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}

            {selectedEvent ? "متابعة التعديل" : "متابعة الإضافة"}
          </Button>
        </>
      }
    >
      <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
        <EventInfoSection
          form={form}
          clients={clients}
          isSubmitting={isSubmitting}
        />

        <EventBrandingSection
          form={form}
          isSubmitting={isSubmitting}
          isBrandingLoading={isBrandingLoading}
          isDeletingBranding={isDeletingBranding}
          hasPersistedBranding={hasPersistedBranding}
          logoPreview={logoPreview}
          backgroundPreview={backgroundPreview}
          onImageChange={onImageChange}
          onImageRemove={onImageRemove}
          onDeleteBranding={onDeleteBranding}
        />
      </form>
    </Modal>
  );
}
