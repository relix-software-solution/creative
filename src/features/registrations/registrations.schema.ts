import { z } from "zod";

export const registrationSchema = z.object({
  eventId: z.string().min(1, "الفعالية مطلوبة"),

  attendeeTypeId: z.string().min(1, "نوع الحضور مطلوب"),

  fullName: z.string().trim().min(1, "الاسم الكامل مطلوب"),

  phone: z.string().trim().optional().or(z.literal("")),

  /*
   * حقول نظام/إدارة وليست جزءًا ثابتًا من نموذج الزائر.
   * بيانات الزائر الأخرى كلها تحفظ داخل customFields بحسب إعدادات الفعالية.
   */
  externalId: z.string().trim().optional().or(z.literal("")),

  notes: z.string().trim().optional().or(z.literal("")),
});

export type RegistrationFormValues = z.infer<typeof registrationSchema>;
