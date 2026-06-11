import { z } from "zod";

function validateJson(value?: string) {
  if (!value?.trim()) return true;

  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}

export const deviceSchema = z.object({
  eventId: z.string().min(1, "الفعالية مطلوبة"),
  name: z.string().min(1, "اسم الجهاز مطلوب"),
  code: z.string().optional(),
  metadataJson: z
    .string()
    .optional()
    .refine(validateJson, "صيغة metadata يجب أن تكون JSON صحيحة"),
});

export type DeviceFormValues = z.infer<typeof deviceSchema>;
