import { z } from "zod";

export const attendeeTypeSchema = z.object({
  eventId: z.string().min(1, "الفعالية مطلوبة"),
  code: z.string().min(1, "كود نوع الحضور مطلوب"),
  nameAr: z.string().min(1, "اسم نوع الحضور بالعربي مطلوب"),
  nameEn: z.string().min(1, "اسم نوع الحضور بالإنجليزي مطلوب"),
  descriptionAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  isActive: z.boolean(),
  sortOrder: z.coerce.number().min(0, "الترتيب يجب أن يكون صفر أو أكبر"),
});

export type AttendeeTypeFormInput = z.input<typeof attendeeTypeSchema>;
export type AttendeeTypeFormValues = z.output<typeof attendeeTypeSchema>;
