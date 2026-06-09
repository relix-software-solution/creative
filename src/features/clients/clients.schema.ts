import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().min(1, "اسم العميل مطلوب"),

  contactName: z.string().optional(),

  contactPhone: z.string().optional(),

  contactEmail: z
    .string()
    .email("البريد الإلكتروني غير صحيح")
    .optional()
    .or(z.literal("")),

  notes: z.string().optional(),
});

export type ClientFormValues = z.infer<typeof clientSchema>;
