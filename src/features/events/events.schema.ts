import { z } from "zod";

export const eventSchema = z
  .object({
    clientId: z.string().min(1, "العميل مطلوب"),

    type: z.enum(["EXHIBITION", "CONFERENCE", "WORKSHOP", "OTHER"], {
      message: "نوع الفعالية مطلوب",
    }),

    titleAr: z.string().min(1, "اسم الفعالية بالعربي مطلوب"),
    titleEn: z.string().min(1, "اسم الفعالية بالإنجليزي مطلوب"),

    descriptionAr: z.string().optional(),
    descriptionEn: z.string().optional(),

    startsAt: z.string().min(1, "تاريخ البداية مطلوب"),
    endsAt: z.string().min(1, "تاريخ النهاية مطلوب"),

    timezone: z.string().min(1, "المنطقة الزمنية مطلوبة"),

    allowReEntry: z.boolean(),

    duplicateStrategy: z.enum(["PHONE", "EMAIL", "EXTERNAL_ID"], {
      message: "استراتيجية التكرار مطلوبة",
    }),

    qrValidFrom: z.string().optional(),
    qrValidUntil: z.string().optional(),
  })
  .refine((values) => new Date(values.endsAt) > new Date(values.startsAt), {
    message: "تاريخ النهاية يجب أن يكون بعد تاريخ البداية",
    path: ["endsAt"],
  });

export type EventFormValues = z.infer<typeof eventSchema>;
