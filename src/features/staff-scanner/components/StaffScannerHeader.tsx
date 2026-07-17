import { Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScanType } from "@/features/scans/scans.types";
import { StaffScannerTheme } from "../utils/staff-scanner.types";

export function StaffScannerHeader({
  theme,
  logoUrl,
  eventTitle,
  checkpointName,
  deviceLabel,
  isOnline,
  isReady,
  pendingCount,
  scanType,
}: {
  theme: StaffScannerTheme;
  logoUrl: string;
  eventTitle: string;
  checkpointName: string;
  deviceLabel: string;
  isOnline: boolean;
  isReady: boolean;
  pendingCount: number;
  scanType: ScanType;
}) {
  return (
    <section
      className="overflow-hidden border border-black/10 bg-black text-white shadow-[0_24px_70px_rgba(0,0,0,0.14)]"
      style={{ borderRadius: `calc(${theme.radius} + 0.5rem)` }}
    >
      <div
        className="p-5 sm:p-7"
        style={{
          background: `radial-gradient(circle at 20% 20%, ${theme.primary}55, transparent 35%), linear-gradient(135deg,#050505,#171717)`,
        }}
      >
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex items-start gap-4">
            {logoUrl ? (
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden border border-white/10 bg-white/10 p-2"
                style={{ borderRadius: theme.radius }}
              >
                <img
                  src={logoUrl}
                  alt={eventTitle}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : null}

            <div>
              <p
                className="text-xs font-extrabold uppercase tracking-wide"
                style={{ color: theme.primary }}
              >
                Staff Scanner
              </p>

              <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">
                إدارة دخول الزوار
              </h1>

              <p className="mt-3 text-sm font-bold leading-7 text-white/65">
                {eventTitle} — {checkpointName}
              </p>

              <p className="mt-1 text-xs font-bold text-white/45">
                {deviceLabel}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap lg:justify-end">
            <Badge variant={isOnline ? "success" : "warning"}>
              {isOnline ? (
                <Wifi className="h-4 w-4" />
              ) : (
                <WifiOff className="h-4 w-4" />
              )}
              {isOnline ? "متصل" : "Offline"}
            </Badge>

            <Badge variant={isReady ? "success" : "warning"}>
              {isReady ? "جاهز للمسح" : "تجهيز..."}
            </Badge>

            <Badge variant={pendingCount > 0 ? "warning" : "success"}>
              معلق: {pendingCount}
            </Badge>

            <Badge style={{ color: theme.primaryHover }}>{scanType}</Badge>
          </div>
        </div>
      </div>
    </section>
  );
}
