import { z } from "zod";

const MAX_IMPORT_FILE_SIZE = 20 * 1024 * 1024;

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
        file.name.toLowerCase().endsWith(".csv") ||
        file.name.toLowerCase().endsWith(".xlsx") ||
        file.name.toLowerCase().endsWith(".xls"),
      "الملف يجب أن يكون CSV أو Excel",
    )
    .refine(
      (file) => file.size <= MAX_IMPORT_FILE_SIZE,
      "حجم الملف يجب ألا يتجاوز 20MB",
    ),
});

export type RegistrationsImportFormValues = z.infer<
  typeof registrationsImportSchema
>;
