import { z } from "zod";

export const zoneSchema = z.object({
  eventId: z.string().min(1, "الفعالية مطلوبة"),
  venueId: z.string().min(1, "المكان مطلوب"),
  nameAr: z.string().min(1, "اسم المنطقة بالعربي مطلوب"),
  nameEn: z.string().min(1, "اسم المنطقة بالإنجليزي مطلوب"),
  code: z.string().min(1, "كود المنطقة مطلوب"),
  sortOrder: z.coerce.number().min(0, "الترتيب يجب أن يكون صفر أو أكبر"),
});

export type ZoneFormInput = z.input<typeof zoneSchema>;
export type ZoneFormValues = z.output<typeof zoneSchema>;
