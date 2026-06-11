import { z } from "zod";

export const venueSchema = z.object({
  eventId: z.string().min(1, "الفعالية مطلوبة"),

  nameAr: z.string().trim().min(1, "اسم المكان بالعربي مطلوب"),

  nameEn: z.string().trim().min(1, "اسم المكان بالإنجليزي مطلوب"),

  addressAr: z.string().trim().optional().or(z.literal("")),

  addressEn: z.string().trim().optional().or(z.literal("")),

  city: z.string().trim().min(1, "المدينة مطلوبة"),

  country: z.string().trim().min(1, "الدولة مطلوبة"),
});

export type VenueFormValues = z.infer<typeof venueSchema>;
