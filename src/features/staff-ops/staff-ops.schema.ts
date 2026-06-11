import { z } from "zod";

export const staffAssignmentSchema = z.object({
  eventId: z.string().min(1, "الفعالية مطلوبة"),
  userId: z.string().min(1, "الموظف مطلوب"),
  checkpointId: z.string().min(1, "نقطة المسح مطلوبة"),
  deviceId: z.string().min(1, "الجهاز مطلوب"),
});

export const startStaffSessionSchema = z.object({
  eventId: z.string().min(1, "الفعالية مطلوبة"),
  staffUserId: z.string().min(1, "الموظف مطلوب"),
  deviceId: z.string().min(1, "الجهاز مطلوب"),
  checkpointId: z.string().min(1, "نقطة الدخول مطلوبة"),
});

export type StaffAssignmentFormValues = z.infer<typeof staffAssignmentSchema>;

export type StartStaffSessionFormValues = z.infer<
  typeof startStaffSessionSchema
>;
