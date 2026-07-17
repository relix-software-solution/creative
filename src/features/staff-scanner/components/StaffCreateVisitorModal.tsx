import { CheckCircle2, Loader2 } from "lucide-react";
import { CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { StaffCreateVisitorModalProps } from "../utils/staff-scanner.types";
import { StaffBaseInput, StaffDynamicField } from "./StaffDynamicField";

export function StaffCreateVisitorModal({
  open,
  theme,
  attendeeTypes,
  attendeeTypeId,
  form,
  customFields,
  visibleFields,
  errors,
  isSubmitting,
  onClose,
  onSubmit,
  onAttendeeTypeChange,
  onFormChange,
  onCustomChange,
}: StaffCreateVisitorModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="تسجيل زائر جديد"
      description="أدخل بيانات الزائر حسب حقول الفعالية، وسيتم إنشاء QR له."
      className="max-w-4xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            إلغاء
          </Button>

          <Button
            onClick={() => {
              const formElement = document.getElementById(
                "staff-create-visitor-form",
              ) as HTMLFormElement | null;

              formElement?.requestSubmit();
            }}
            disabled={isSubmitting}
            style={{ backgroundColor: theme.primary }}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            إنشاء التسجيل
          </Button>
        </>
      }
    >
      <form
        id="staff-create-visitor-form"
        className="grid gap-4"
        onSubmit={onSubmit}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <div className="mb-2 flex items-center justify-between gap-3">
              <label
                className="text-sm font-extrabold"
                style={{ color: theme.text }}
              >
                نوع الحضور <span className="mr-1 text-red-600">*</span>
              </label>

              <span
                dir="ltr"
                className="text-left text-xs font-extrabold uppercase tracking-wide opacity-45"
                style={{ color: theme.text }}
              >
                Attendee Type
              </span>
            </div>

            <select
              value={attendeeTypeId}
              onChange={(event) => onAttendeeTypeChange(event.target.value)}
              disabled={isSubmitting}
              className="h-12 w-full border border-black/10 bg-white px-4 text-sm font-bold outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:bg-black/5"
              style={
                {
                  borderRadius: theme.radius,
                  color: theme.text,
                  borderColor: errors.attendeeTypeId ? "#DC2626" : undefined,
                  "--tw-ring-color": `${theme.primary}1A`,
                } as CSSProperties
              }
            >
              <option value="">اختر نوع الحضور</option>

              {attendeeTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.nameAr || type.nameEn || type.code}
                </option>
              ))}
            </select>

            {errors.attendeeTypeId ? (
              <p className="text-sm font-bold text-red-600">
                {errors.attendeeTypeId}
              </p>
            ) : null}
          </div>

          <StaffBaseInput
            ar="الاسم الكامل"
            en="Full Name"
            required
            value={form.fullName}
            placeholder="مثال: محمد أحمد"
            error={errors.fullName}
            theme={theme}
            onChange={(value) => onFormChange("fullName", value)}
          />

          <StaffBaseInput
            ar="رقم الهاتف"
            en="Phone Number"
            required
            value={form.phone}
            placeholder="+963944123456"
            error={errors.phone}
            theme={theme}
            dir="ltr"
            inputMode="tel"
            onChange={(value) => onFormChange("phone", value)}
          />

          <StaffBaseInput
            ar="البريد الإلكتروني"
            en="Email Address"
            required
            value={form.email}
            placeholder="name@example.com"
            error={errors.email}
            theme={theme}
            dir="ltr"
            type="email"
            className="md:col-span-2"
            onChange={(value) => onFormChange("email", value)}
          />
        </div>

        {visibleFields.length > 0 ? (
          <div className="grid gap-4 border-t border-black/10 pt-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <p
                className="text-sm font-extrabold"
                style={{ color: theme.primary }}
              >
                بيانات إضافية
              </p>

              <p
                className="mt-1 text-xs font-bold opacity-50"
                style={{ color: theme.text }}
              >
                هذه الحقول يتم جلبها من إعدادات الفعالية ونوع الحضور.
              </p>
            </div>

            {visibleFields.map((field) => (
              <StaffDynamicField
                key={field.id}
                field={field}
                value={customFields[field.key]}
                error={errors[field.key]}
                theme={theme}
                disabled={isSubmitting}
                onChange={(value) => onCustomChange(field.key, value)}
              />
            ))}
          </div>
        ) : null}
      </form>
    </Modal>
  );
}
