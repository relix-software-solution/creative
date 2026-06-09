import { z } from "zod";

export const venueSchema = z.object({
  eventId: z.string().min(1, "الفعالية مطلوبة"),
  nameAr: z.string().min(1, "اسم المكان بالعربي مطلوب"),
  nameEn: z.string().min(1, "اسم المكان بالإنجليزي مطلوب"),
  addressAr: z.string().optional(),
  addressEn: z.string().optional(),
  city: z.string().min(1, "المدينة مطلوبة"),
  country: z.string().min(1, "الدولة مطلوبة"),
});

export type VenueFormValues = z.infer<typeof venueSchema>;
