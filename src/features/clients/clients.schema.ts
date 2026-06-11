import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().trim().min(1, "اسم العميل مطلوب"),

  contactName: z.string().trim().optional().or(z.literal("")),

  contactPhone: z.string().trim().optional().or(z.literal("")),

  contactEmail: z
    .string()
    .trim()
    .email("البريد الإلكتروني غير صحيح")
    .optional()
    .or(z.literal("")),

  notes: z.string().trim().optional().or(z.literal("")),
});

export type ClientFormValues = z.infer<typeof clientSchema>;
