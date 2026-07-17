import {
  AlertTriangle,
  Camera,
  Loader2,
  QrCode,
  RefreshCw,
} from "lucide-react";
import { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { StaffScannerTheme } from "../utils/staff-scanner.types";

export function StaffCameraPanel({
  theme,
  isReady,
  isSubmitting,
  isCameraOpen,
  isCameraStarting,
  cameraError,
  videoRef,
  onStart,
  onStop,
  onRefresh,
  onNewScan,
}: {
  theme: StaffScannerTheme;
  isReady: boolean;
  isSubmitting: boolean;
  isCameraOpen: boolean;
  isCameraStarting: boolean;
  cameraError: string;
  videoRef: RefObject<HTMLVideoElement | null>;
  onStart: () => void;
  onStop: () => void;
  onRefresh: () => void;
  onNewScan: () => void;
}) {
  return (
    <div
      className="border border-black/10 bg-white p-4 shadow-[0_24px_70px_rgba(0,0,0,0.08)] sm:p-6"
      style={{ borderRadius: `calc(${theme.radius} + 0.5rem)` }}
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold" style={{ color: theme.text }}>
            الكاميرا
          </h2>

          <p
            className="mt-1 text-sm font-bold opacity-55"
            style={{ color: theme.text }}
          >
            اضغط تشغيل الكاميرا ووجّهها نحو QR.
          </p>
        </div>

        <Button variant="outline" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4" />
          تحديث
        </Button>
      </div>

      {cameraError ? (
        <div className="mb-5 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-7 text-amber-800">
          <AlertTriangle className="mt-1 h-5 w-5 shrink-0" />
          <span>{cameraError}</span>
        </div>
      ) : null}

      {isCameraOpen ? (
        <div
          className="relative mb-5 overflow-hidden bg-black p-3"
          style={{ borderRadius: `calc(${theme.radius} + 0.5rem)` }}
        >
          <video
            ref={videoRef}
            className="h-[58vh] max-h-[560px] min-h-[360px] w-full object-cover"
            style={{ borderRadius: theme.radius }}
            playsInline
            muted
          />

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div
              className="h-64 w-64 border-4 shadow-[0_0_0_999px_rgba(0,0,0,0.42)]"
              style={{
                borderRadius: theme.radius,
                borderColor: theme.primary,
              }}
            />
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/80 px-5 py-2 text-sm font-extrabold text-white">
            وجّه الكاميرا نحو QR
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onStart}
          disabled={!isReady || isCameraStarting || isSubmitting}
          className="mb-5 flex min-h-[320px] w-full items-center justify-center border-2 border-dashed transition disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-[420px]"
          style={{
            borderRadius: theme.radius,
            backgroundColor: theme.background,
            color: theme.text,
            borderColor: `${theme.primary}55`,
          }}
        >
          <div className="text-center">
            <div
              className="mx-auto mb-5 flex h-24 w-24 items-center justify-center bg-black shadow-xl sm:h-28 sm:w-28"
              style={{
                borderRadius: theme.radius,
                color: theme.primary,
              }}
            >
              {isCameraStarting || isSubmitting ? (
                <Loader2 className="h-12 w-12 animate-spin" />
              ) : (
                <QrCode className="h-14 w-14" />
              )}
            </div>

            <p className="text-3xl font-extrabold">تشغيل الكاميرا</p>

            <p className="mt-3 text-sm font-bold opacity-55">
              اضغط هنا لبدء قراءة QR
            </p>
          </div>
        </button>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          size="lg"
          disabled={!isReady || isCameraStarting || isSubmitting}
          onClick={isCameraOpen ? onStop : onStart}
          variant={isCameraOpen ? "danger" : "secondary"}
        >
          <Camera className="h-5 w-5" />
          {isCameraOpen ? "إيقاف الكاميرا" : "تشغيل الكاميرا"}
        </Button>

        <Button size="lg" variant="outline" onClick={onNewScan}>
          <RefreshCw className="h-5 w-5" />
          Scan جديد
        </Button>
      </div>
    </div>
  );
}
