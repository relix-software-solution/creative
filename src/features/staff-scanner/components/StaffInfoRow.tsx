import { StaffScannerTheme } from "../utils/staff-scanner.types";

export function StaffInfoRow({
  theme,
  label,
  value,
  dir,
}: {
  theme: StaffScannerTheme;
  label: string;
  value?: string | null;
  dir?: "rtl" | "ltr";
}) {
  return (
    <div
      className="bg-white p-4 shadow-sm"
      style={{
        borderRadius: theme.radius,
        color: theme.text,
      }}
    >
      <p className="text-xs font-bold opacity-45">{label}</p>

      <p
        dir={dir}
        className={`mt-2 break-words text-base font-extrabold ${
          dir === "ltr" ? "text-left" : ""
        }`}
      >
        {value || "—"}
      </p>
    </div>
  );
}
