"use client";

import { CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EventFormInstance } from "../_lib/events-page.types";
import { duplicateStrategyLabels } from "../_lib/events-page.utils";
import { DuplicateStrategy, EventType } from "@/features/events/events.types";

export function EventInfoSection({
  form,
  clients,
  isSubmitting,
}: {
  form: EventFormInstance;
  clients: Array<{ id: string; name: string }>;
  isSubmitting: boolean;
}) {
  return (
    <>
      <section className="rounded-[1.5rem] border border-black/10 bg-white p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-extrabold text-[#4B4B4B]">
              بيانات الفعالية
            </h3>

            <p className="mt-1 text-xs font-bold text-[#4B4B4B]/45">
              المعلومات الأساسية والتواريخ.
            </p>
          </div>

          <CalendarDays className="h-5 w-5 text-[#A88042]" />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Select
            label="العميل"
            className="md:col-span-2"
            value={form.watch("clientId")}
            placeholder="اختر العميل"
            error={form.formState.errors.clientId?.message}
            onChange={(value) => {
              form.setValue("clientId", value, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
            options={clients.map((client) => ({
              label: client.name,
              value: client.id,
            }))}
          />

          <Input
            label="اسم الفعالية بالعربي"
            placeholder="مثال: معرض دمشق الدولي"
            error={form.formState.errors.titleAr?.message}
            disabled={isSubmitting}
            {...form.register("titleAr")}
          />

          <Input
            label="اسم الفعالية بالإنجليزي"
            placeholder="Damascus International Fair"
            error={form.formState.errors.titleEn?.message}
            disabled={isSubmitting}
            {...form.register("titleEn")}
          />

          <Select
            label="نوع الفعالية"
            value={form.watch("type")}
            error={form.formState.errors.type?.message}
            onChange={(value) => {
              form.setValue("type", value as EventType, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
            options={[
              { label: "معرض", value: "EXHIBITION" },
              { label: "مؤتمر", value: "CONFERENCE" },
              { label: "ورشة عمل", value: "WORKSHOP" },
              { label: "أخرى", value: "OTHER" },
            ]}
          />

          <Input
            label="المنطقة الزمنية"
            placeholder="Asia/Damascus"
            error={form.formState.errors.timezone?.message}
            disabled={isSubmitting}
            {...form.register("timezone")}
          />

          <Input
            label="تاريخ البداية"
            type="datetime-local"
            error={form.formState.errors.startsAt?.message}
            disabled={isSubmitting}
            {...form.register("startsAt")}
          />

          <Input
            label="تاريخ النهاية"
            type="datetime-local"
            error={form.formState.errors.endsAt?.message}
            disabled={isSubmitting}
            {...form.register("endsAt")}
          />

          <Input
            label="صلاحية QR من"
            type="datetime-local"
            error={form.formState.errors.qrValidFrom?.message}
            disabled={isSubmitting}
            {...form.register("qrValidFrom")}
          />

          <Input
            label="صلاحية QR حتى"
            type="datetime-local"
            error={form.formState.errors.qrValidUntil?.message}
            disabled={isSubmitting}
            {...form.register("qrValidUntil")}
          />

          <Select
            label="استراتيجية منع التكرار"
            value={form.watch("duplicateStrategy")}
            error={form.formState.errors.duplicateStrategy?.message}
            onChange={(value) => {
              form.setValue("duplicateStrategy", value as DuplicateStrategy, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
            options={[
              { label: duplicateStrategyLabels.PHONE, value: "PHONE" },
              { label: duplicateStrategyLabels.EMAIL, value: "EMAIL" },
              {
                label: duplicateStrategyLabels.EXTERNAL_ID,
                value: "EXTERNAL_ID",
              },
            ]}
          />

          <label className="flex min-h-[48px] items-center gap-3 rounded-2xl border border-black/10 bg-[#F8F8FF] px-4">
            <input
              type="checkbox"
              className="h-5 w-5 accent-[#A88042]"
              disabled={isSubmitting}
              {...form.register("allowReEntry")}
            />

            <span className="text-sm font-extrabold text-[#4B4B4B]">
              السماح بإعادة الدخول بنفس QR
            </span>
          </label>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-black/10 bg-white p-4">
        <h3 className="mb-3 text-lg font-extrabold text-[#4B4B4B]">الوصف</h3>

        <div className="grid gap-3">
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#4B4B4B]">
              الوصف العربي
            </label>

            <textarea
              {...form.register("descriptionAr")}
              rows={2}
              disabled={isSubmitting}
              className="w-full resize-none rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-bold text-[#4B4B4B] outline-none transition placeholder:text-[#4B4B4B]/40 focus:border-[#A88042] focus:ring-4 focus:ring-[#A88042]/10 disabled:cursor-not-allowed disabled:bg-black/5"
              placeholder="أدخل وصف الفعالية بالعربي..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-[#4B4B4B]">
              الوصف الإنجليزي
            </label>

            <textarea
              {...form.register("descriptionEn")}
              rows={2}
              disabled={isSubmitting}
              className="w-full resize-none rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-bold text-[#4B4B4B] outline-none transition placeholder:text-[#4B4B4B]/40 focus:border-[#A88042] focus:ring-4 focus:ring-[#A88042]/10 disabled:cursor-not-allowed disabled:bg-black/5"
              placeholder="Enter event description in English..."
            />
          </div>
        </div>
      </section>
    </>
  );
}
