import { z } from "zod";

const optionalText = z.string().trim().optional().or(z.literal(""));
const optionalEmail = z
  .string()
  .trim()
  .email("البريد الإلكتروني غير صحيح")
  .optional()
  .or(z.literal(""));

export const clientSchema = z.object({
  name: z.string().trim().min(1, "اسم العميل مطلوب"),
  contactName: optionalText,
  contactPhone: optionalText,
  contactEmail: optionalEmail,
  notes: optionalText,
});

export const createClientWithAccessAccountSchema = clientSchema
  .extend({
    accessFullName: z
      .string()
      .trim()
      .min(1, "اسم مستخدم العميل مطلوب"),
    accessEmail: z
      .string()
      .trim()
      .min(1, "بريد تسجيل الدخول مطلوب")
      .email("بريد تسجيل الدخول غير صحيح"),
    accessPhone: optionalText,
    password: z
      .string()
      .min(8, "كلمة المرور يجب ألا تقل عن 8 أحرف")
      .max(128, "كلمة المرور طويلة جدًا"),
    confirmPassword: z.string().min(1, "تأكيد كلمة المرور مطلوب"),
  })
  .superRefine((values, context) => {
    if (values.password !== values.confirmPassword) {
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "كلمتا المرور غير متطابقتين",
      });
    }
  });

export const clientAccessAccountSchema = z
  .object({
    accountExists: z.boolean(),
    fullName: z.string().trim().min(1, "اسم مستخدم العميل مطلوب"),
    email: z
      .string()
      .trim()
      .min(1, "بريد تسجيل الدخول مطلوب")
      .email("بريد تسجيل الدخول غير صحيح"),
    phone: optionalText,
    newPassword: z.string().max(128, "كلمة المرور طويلة جدًا").optional(),
    confirmPassword: z.string().optional(),
  })
  .superRefine((values, context) => {
    const password = values.newPassword ?? "";
    const confirmation = values.confirmPassword ?? "";

    if (!values.accountExists && password.length < 8) {
      context.addIssue({
        code: "custom",
        path: ["newPassword"],
        message: "كلمة المرور مطلوبة ويجب ألا تقل عن 8 أحرف",
      });
    }

    if (values.accountExists && password.length > 0 && password.length < 8) {
      context.addIssue({
        code: "custom",
        path: ["newPassword"],
        message: "كلمة المرور يجب ألا تقل عن 8 أحرف",
      });
    }

    if (password && password !== confirmation) {
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "كلمتا المرور غير متطابقتين",
      });
    }
  });

export type ClientFormValues = z.infer<typeof clientSchema>;
export type CreateClientWithAccessAccountFormValues = z.infer<
  typeof createClientWithAccessAccountSchema
>;
export type ClientAccessAccountFormValues = z.infer<
  typeof clientAccessAccountSchema
>;
