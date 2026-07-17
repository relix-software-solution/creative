"use client";

import { AlertTriangle, Loader2, Palette, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  EventFormInstance,
  ImageChangeHandler,
  ImageRemoveHandler,
} from "../_lib/events-page.types";
import { defaultTheme } from "../_lib/events-page.utils";
import { ColorPickerField, ImageUploadCard } from "./form-controls";

export function EventBrandingSection({
  form,
  isSubmitting,
  isBrandingLoading,
  isDeletingBranding,
  hasPersistedBranding,
  logoPreview,
  backgroundPreview,
  onImageChange,
  onImageRemove,
  onDeleteBranding,
}: {
  form: EventFormInstance;
  isSubmitting: boolean;
  isBrandingLoading: boolean;
  isDeletingBranding: boolean;
  hasPersistedBranding: boolean;
  logoPreview: string;
  backgroundPreview: string;
  onImageChange: ImageChangeHandler;
  onImageRemove: ImageRemoveHandler;
  onDeleteBranding: () => void;
}) {
  const watchedValues = form.watch();

  return (
    <section className="rounded-[1.5rem] border border-black/10 bg-white p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-extrabold text-[#4B4B4B]">
            الهوية البصرية
          </h3>

          <p className="mt-1 text-xs font-bold leading-6 text-[#4B4B4B]/45">
            الشعار والخلفية اختياريان. يمكنك استخدام خلفية مصممة تحتوي على اسم
            الفعالية والشعار.
          </p>
        </div>

        {isBrandingLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-[#A88042]" />
        ) : (
          <Palette className="h-5 w-5 text-[#A88042]" />
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <ImageUploadCard
          label="شعار الفعالية — اختياري"
          hint={logoPreview ? "اختر صورة جديدة للاستبدال" : "PNG / JPG / WEBP"}
          preview={logoPreview}
          onRemove={() => onImageRemove("logo")}
          onChange={(event) => onImageChange(event, "logo")}
        />

        <ImageUploadCard
          label="صورة الخلفية — اختيارية"
          hint={
            backgroundPreview
              ? "اختر صورة جديدة للاستبدال"
              : "يفضل صورة عريضة وعالية الجودة"
          }
          preview={backgroundPreview}
          onRemove={() => onImageRemove("background")}
          onChange={(event) => onImageChange(event, "background")}
        />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <ColorPickerField
          label="اللون الأساسي"
          value={watchedValues.themePrimary || defaultTheme.primary}
          onChange={(value) =>
            form.setValue("themePrimary", value, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
          error={form.formState.errors.themePrimary?.message}
        />

        <ColorPickerField
          label="لون Hover"
          value={watchedValues.themePrimaryHover || defaultTheme.primaryHover}
          onChange={(value) =>
            form.setValue("themePrimaryHover", value, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
          error={form.formState.errors.themePrimaryHover?.message}
        />

        <ColorPickerField
          label="لون الخلفية"
          value={watchedValues.themeBackground || defaultTheme.background}
          onChange={(value) =>
            form.setValue("themeBackground", value, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
          error={form.formState.errors.themeBackground?.message}
        />

        <ColorPickerField
          label="لون النص"
          value={watchedValues.themeText || defaultTheme.text}
          onChange={(value) =>
            form.setValue("themeText", value, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
          error={form.formState.errors.themeText?.message}
        />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
        <Input
          label="Radius"
          placeholder="1.5rem"
          dir="ltr"
          error={form.formState.errors.themeRadius?.message}
          disabled={isSubmitting}
          {...form.register("themeRadius")}
        />

        <div
          className="flex h-12 items-center justify-center px-5 text-sm font-extrabold text-white"
          style={{
            backgroundColor: watchedValues.themePrimary || defaultTheme.primary,
            borderRadius: watchedValues.themeRadius || defaultTheme.radius,
          }}
        >
          معاينة الزر
        </div>
      </div>

      {hasPersistedBranding ? (
        <div className="mt-5 border-t border-black/10 pt-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-extrabold text-red-700">
                حذف الهوية البصرية
              </p>

              <p className="mt-1 text-xs font-bold leading-6 text-red-600/70">
                سيتم حذف الشعار والخلفية والألوان المحفوظة نهائيًا، من دون حذف
                الفعالية نفسها.
              </p>
            </div>

            <Button
              type="button"
              variant="danger"
              disabled={isSubmitting || isDeletingBranding}
              onClick={onDeleteBranding}
            >
              {isDeletingBranding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              حذف الهوية بالكامل
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
