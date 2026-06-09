import { z } from "zod";

export const registrationFieldSchema = z.object({
  eventId: z.string().min(1, "الفعالية مطلوبة"),
  attendeeTypeId: z.string().min(1, "نوع الحضور مطلوب"),

  key: z
    .string()
    .min(1, "مفتاح الحقل مطلوب")
    .regex(
      /^[a-zA-Z][a-zA-Z0-9_]*$/,
      "المفتاح يجب أن يبدأ بحرف ويحتوي أحرف وأرقام و _ فقط",
    ),

  labelAr: z.string().min(1, "اسم الحقل بالعربي مطلوب"),
  labelEn: z.string().min(1, "اسم الحقل بالإنجليزي مطلوب"),

  type: z.enum(
    [
      "TEXT",
      "TEXTAREA",
      "EMAIL",
      "PHONE",
      "NUMBER",
      "DATE",
      "SELECT",
      "CHECKBOX",
    ],
    {
      message: "نوع الحقل مطلوب",
    },
  ),

  placeholderAr: z.string().optional(),
  placeholderEn: z.string().optional(),

  options: z
    .string()
    .optional()
    .transform((value) => {
      if (!value) return [];

      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }),

  isRequired: z.boolean(),
  isActive: z.boolean(),

  sortOrder: z.coerce.number().min(0, "الترتيب يجب أن يكون صفر أو أكبر"),
});

export type RegistrationFieldFormInput = z.input<
  typeof registrationFieldSchema
>;
export type RegistrationFieldFormValues = z.output<
  typeof registrationFieldSchema
>;
