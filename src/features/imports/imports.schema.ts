import { z } from "zod";

export const registrationsImportSchema = z.object({
  eventId: z.string().min(1, "الفعالية مطلوبة"),
  attendeeTypeId: z.string().min(1, "نوع الحضور مطلوب"),
  file: z
    .custom<File>((value) => value instanceof File, "ملف الاستيراد مطلوب")
    .refine(
      (file) =>
        [
          "text/csv",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ].includes(file.type) ||
        file.name.endsWith(".csv") ||
        file.name.endsWith(".xlsx") ||
        file.name.endsWith(".xls"),
      "الملف يجب أن يكون CSV أو Excel",
    ),
});

export type RegistrationsImportFormValues = z.infer<
  typeof registrationsImportSchema
>;
