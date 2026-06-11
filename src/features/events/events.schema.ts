import { z } from "zod";

function isValidDate(value: string) {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

export const eventSchema = z
  .object({
    clientId: z.string().min(1, "العميل مطلوب"),

    type: z.enum(["EXHIBITION", "CONFERENCE", "WORKSHOP", "OTHER"], {
      message: "نوع الفعالية مطلوب",
    }),

    titleAr: z.string().trim().min(1, "اسم الفعالية بالعربي مطلوب"),

    titleEn: z.string().trim().min(1, "اسم الفعالية بالإنجليزي مطلوب"),

    descriptionAr: z.string().trim().optional().or(z.literal("")),

    descriptionEn: z.string().trim().optional().or(z.literal("")),

    startsAt: z
      .string()
      .min(1, "تاريخ البداية مطلوب")
      .refine(isValidDate, "تاريخ البداية غير صحيح"),

    endsAt: z
      .string()
      .min(1, "تاريخ النهاية مطلوب")
      .refine(isValidDate, "تاريخ النهاية غير صحيح"),

    timezone: z.string().trim().min(1, "المنطقة الزمنية مطلوبة"),

    allowReEntry: z.boolean(),

    duplicateStrategy: z.enum(["PHONE", "EMAIL", "EXTERNAL_ID"], {
      message: "استراتيجية التكرار مطلوبة",
    }),

    qrValidFrom: z.string().optional().or(z.literal("")),

    qrValidUntil: z.string().optional().or(z.literal("")),
  })
  .refine((values) => new Date(values.endsAt) > new Date(values.startsAt), {
    message: "تاريخ النهاية يجب أن يكون بعد تاريخ البداية",
    path: ["endsAt"],
  })
  .refine(
    (values) => {
      if (!values.qrValidFrom || !values.qrValidUntil) return true;

      return new Date(values.qrValidUntil) > new Date(values.qrValidFrom);
    },
    {
      message: "نهاية صلاحية QR يجب أن تكون بعد بدايتها",
      path: ["qrValidUntil"],
    },
  );

export type EventFormValues = z.infer<typeof eventSchema>;
