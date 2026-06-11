import { z } from "zod";

export const attendeeTypeSchema = z.object({
  eventId: z.string().min(1, "الفعالية مطلوبة"),

  code: z.string().trim().min(1, "كود نوع الحضور مطلوب"),

  nameAr: z.string().trim().min(1, "اسم نوع الحضور بالعربي مطلوب"),

  nameEn: z.string().trim().min(1, "اسم نوع الحضور بالإنجليزي مطلوب"),

  descriptionAr: z.string().trim().optional().or(z.literal("")),

  descriptionEn: z.string().trim().optional().or(z.literal("")),

  isActive: z.boolean(),

  sortOrder: z.coerce.number().min(0, "الترتيب يجب أن يكون صفر أو أكبر"),
});

export type AttendeeTypeFormInput = z.input<typeof attendeeTypeSchema>;
export type AttendeeTypeFormValues = z.output<typeof attendeeTypeSchema>;
