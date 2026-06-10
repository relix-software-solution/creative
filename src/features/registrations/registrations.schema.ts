import { z } from "zod";

function isValidJsonObject(value?: string) {
  if (!value || !value.trim()) return true;

  try {
    const parsed = JSON.parse(value);
    return (
      parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
    );
  } catch {
    return false;
  }
}

export const registrationSchema = z.object({
  eventId: z.string().min(1, "الفعالية مطلوبة"),
  attendeeTypeId: z.string().min(1, "نوع الحضور مطلوب"),

  fullName: z.string().min(1, "الاسم الكامل مطلوب"),

  phone: z.string().optional(),

  email: z
    .string()
    .email("البريد الإلكتروني غير صحيح")
    .optional()
    .or(z.literal("")),

  companyName: z.string().optional(),
  jobTitle: z.string().optional(),
  externalId: z.string().optional(),
  notes: z.string().optional(),

  customFieldsJson: z
    .string()
    .optional()
    .refine(isValidJsonObject, "الحقول الإضافية يجب أن تكون JSON Object صحيح"),
});

export type RegistrationFormValues = z.infer<typeof registrationSchema>;
