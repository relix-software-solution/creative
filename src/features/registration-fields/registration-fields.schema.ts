import { z } from "zod";
import { RegistrationFieldOption } from "./registration-fields.types";

function normalizeOptions(value?: string): RegistrationFieldOption[] {
  if (!value?.trim()) return [];

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => ({
      labelAr: item,
      labelEn: item,
      value: item.toLowerCase().replace(/\s+/g, "_"),
    }));
}

export const registrationFieldSchema = z.object({
  eventId: z.string().min(1, "الفعالية مطلوبة"),

  attendeeTypeId: z.string().min(1, "نوع الحضور مطلوب"),

  key: z
    .string()
    .trim()
    .min(1, "مفتاح الحقل مطلوب")
    .regex(
      /^[a-zA-Z][a-zA-Z0-9_]*$/,
      "المفتاح يجب أن يبدأ بحرف ويحتوي أحرف وأرقام و _ فقط",
    ),

  labelAr: z.string().trim().min(1, "اسم الحقل بالعربي مطلوب"),

  labelEn: z.string().trim().min(1, "اسم الحقل بالإنجليزي مطلوب"),

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

  placeholderAr: z.string().trim().optional().or(z.literal("")),

  placeholderEn: z.string().trim().optional().or(z.literal("")),

  options: z.string().optional().transform(normalizeOptions),

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
