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

  fullName: z.string().trim().min(1, "الاسم الكامل مطلوب"),

  phone: z.string().trim().optional().or(z.literal("")),

  email: z
    .string()
    .trim()
    .email("البريد الإلكتروني غير صحيح")
    .optional()
    .or(z.literal("")),

  companyName: z.string().trim().optional().or(z.literal("")),

  jobTitle: z.string().trim().optional().or(z.literal("")),

  externalId: z.string().trim().optional().or(z.literal("")),

  notes: z.string().trim().optional().or(z.literal("")),

  customFieldsJson: z
    .string()
    .optional()
    .refine(isValidJsonObject, "الحقول الإضافية يجب أن تكون JSON Object صحيح"),
});

export type RegistrationFormValues = z.infer<typeof registrationSchema>;
