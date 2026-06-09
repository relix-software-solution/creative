import { z } from "zod";

export const checkpointSchema = z.object({
  eventId: z.string().min(1, "الفعالية مطلوبة"),
  venueId: z.string().min(1, "المكان مطلوب"),
  zoneId: z.string().min(1, "المنطقة مطلوبة"),

  type: z.enum(
    ["ENTRY_GATE", "EXIT_GATE", "REGISTRATION_DESK", "INFO_DESK", "OTHER"],
    {
      message: "نوع نقطة الدخول مطلوب",
    },
  ),

  nameAr: z.string().min(1, "اسم النقطة بالعربي مطلوب"),
  nameEn: z.string().min(1, "اسم النقطة بالإنجليزي مطلوب"),
  code: z.string().min(1, "كود النقطة مطلوب"),

  allowedAttendeeTypes: z
    .string()
    .optional()
    .transform((value) => {
      if (!value) return [];

      return value
        .split(",")
        .map((item) => item.trim().toUpperCase())
        .filter(Boolean);
    }),

  isActive: z.boolean(),

  sortOrder: z.coerce.number().min(0, "الترتيب يجب أن يكون صفر أو أكبر"),
});

export type CheckpointFormInput = z.input<typeof checkpointSchema>;
export type CheckpointFormValues = z.output<typeof checkpointSchema>;
