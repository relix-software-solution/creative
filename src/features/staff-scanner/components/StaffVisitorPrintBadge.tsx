import {
  formatCustomValue,
  resolveAssetUrl,
} from "../utils/staff-scanner.helpers";
import {
  StaffScannerTheme,
  StaffScannerVisitor,
} from "../utils/staff-scanner.types";

export function StaffVisitorPrintBadge({
  theme,
  visitor,
  eventTitle,
  qrImageUrl,
  extraFields,
}: {
  theme: StaffScannerTheme;
  visitor: StaffScannerVisitor;
  eventTitle: string;
  qrImageUrl: string;
  extraFields: { key: string; label: string; value: unknown }[];
}) {
  return (
    <div className="hidden print:block">
      <style>
        {`
          @page {
            size: 100mm 150mm;
            margin: 5mm;
          }

          @media print {
            body * {
              visibility: hidden;
            }

            #staff-print-badge,
            #staff-print-badge * {
              visibility: visible;
            }

            #staff-print-badge {
              position: fixed;
              inset: 0;
              margin: auto;
            }
          }
        `}
      </style>

      <div
        id="staff-print-badge"
        dir="rtl"
        className="bg-white"
        style={{
          width: "90mm",
          minHeight: "135mm",
          color: theme.text,
          border: `1px solid ${theme.primary}55`,
          borderRadius: "18px",
          overflow: "hidden",
        }}
      >
        <div
          className="p-4 text-center text-white"
          style={{
            background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryHover})`,
          }}
        >
          <p className="text-sm font-black">{eventTitle}</p>
          <h2 className="mt-2 text-3xl font-black leading-tight">
            {visitor.fullName}
          </h2>
          <p className="mt-1 text-sm font-bold text-white/80">
            {visitor.attendeeTypeName || "زائر"}
          </p>
        </div>

        <div className="p-4">
          <div className="text-center">
            {qrImageUrl ? (
              <img
                src={resolveAssetUrl(qrImageUrl)}
                alt="QR"
                className="mx-auto h-[185px] w-[185px] rounded-2xl border border-black/10 bg-white object-contain p-2"
              />
            ) : null}
          </div>

          <div className="mt-4 grid gap-2">
            <BadgeRow label="الهاتف" value={visitor.phone} />
            <BadgeRow label="البريد" value={visitor.email} />

            {extraFields.map((field) => (
              <BadgeRow
                key={field.key}
                label={field.label}
                value={formatCustomValue(field.value)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BadgeRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-xl bg-[#F8F8FF] p-2">
      <p className="text-[11px] font-bold text-black/45">{label}</p>
      <p className="mt-1 break-words text-sm font-black text-[#222]">
        {value || "—"}
      </p>
    </div>
  );
}
