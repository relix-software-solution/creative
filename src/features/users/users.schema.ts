import { z } from "zod";

export const userSchema = z
  .object({
    fullName: z.string().min(1, "الاسم الكامل مطلوب"),

    email: z
      .string()
      .email("البريد الإلكتروني غير صحيح")
      .optional()
      .or(z.literal("")),

    phone: z.string().optional(),

    password: z.string().optional(),

    role: z.enum(["STAFF", "CLIENT_VIEWER"], {
      message: "نوع المستخدم مطلوب",
    }),

    clientId: z.string().optional(),
  })
  .superRefine((values, context) => {
    if (values.role === "CLIENT_VIEWER" && !values.clientId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["clientId"],
        message: "العميل مطلوب لمستخدم Client Viewer",
      });
    }
  });

export const createUserSchema = userSchema.superRefine((values, context) => {
  if (!values.password || values.password.length < 8) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["password"],
      message: "كلمة المرور يجب أن تكون 8 أحرف على الأقل",
    });
  }
});

export const updateUserSchema = userSchema;

export const resetUserPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل"),
});

export type UserFormValues = z.infer<typeof userSchema>;
export type ResetUserPasswordFormValues = z.infer<
  typeof resetUserPasswordSchema
>;
