"use client";

import { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Download, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { EventItem } from "@/features/events/events.types";
import { eventTypeLabels } from "../_lib/events-page.utils";

function sanitizeFileName(value: string) {
  const sanitized = value
    .trim()
    .replace(/[^\p{L}\p{N}\-_]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return sanitized || "event-registration";
}

function downloadBlob(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = fileName;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 2_000);
}

async function convertSvgToPng(
  svgElement: SVGSVGElement,
  outputSize = 1400,
): Promise<Blob> {
  const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;

  clonedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clonedSvg.setAttribute("width", String(outputSize));
  clonedSvg.setAttribute("height", String(outputSize));

  if (!clonedSvg.getAttribute("viewBox")) {
    const originalWidth = Number(svgElement.getAttribute("width")) || 260;
    const originalHeight = Number(svgElement.getAttribute("height")) || 260;

    clonedSvg.setAttribute("viewBox", `0 0 ${originalWidth} ${originalHeight}`);
  }

  const serializedSvg = new XMLSerializer().serializeToString(clonedSvg);

  const svgBlob = new Blob([serializedSvg], {
    type: "image/svg+xml;charset=utf-8",
  });

  const svgObjectUrl = URL.createObjectURL(svgBlob);

  try {
    const image = new Image();

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();

      image.onerror = () => {
        reject(new Error("Failed to render QR SVG"));
      };

      image.src = svgObjectUrl;
    });

    const canvas = document.createElement("canvas");

    canvas.width = outputSize;
    canvas.height = outputSize;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas is unavailable");
    }

    /*
     * نضيف خلفية بيضاء حتى يبقى QR واضحًا
     * عند فتحه في أي تطبيق أو طباعته.
     */
    context.fillStyle = "#FFFFFF";
    context.fillRect(0, 0, outputSize, outputSize);

    context.imageSmoothingEnabled = false;
    context.drawImage(image, 0, 0, outputSize, outputSize);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to generate QR PNG"));
            return;
          }

          resolve(blob);
        },
        "image/png",
        1,
      );
    });
  } finally {
    URL.revokeObjectURL(svgObjectUrl);
  }
}

export function RegistrationQrModal({
  open,
  event,
  onClose,
  getPublicRegistrationUrl,
  onCopy,
}: {
  open: boolean;
  event: EventItem | null;
  onClose: () => void;
  getPublicRegistrationUrl: (eventId: string) => string;
  onCopy: (eventId: string) => void;
}) {
  const qrContainerRef = useRef<HTMLDivElement | null>(null);

  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownloadQr() {
    if (!event || isDownloading) {
      return;
    }

    const svgElement = qrContainerRef.current?.querySelector("svg");

    if (!(svgElement instanceof SVGSVGElement)) {
      toast.error("تعذر العثور على رمز QR");
      return;
    }

    setIsDownloading(true);

    try {
      const pngBlob = await convertSvgToPng(svgElement, 1400);

      const eventName =
        event.titleEn?.trim() || event.titleAr?.trim() || event.id;

      const fileName = `${sanitizeFileName(eventName)}-registration-qr.png`;

      downloadBlob(pngBlob, fileName);

      toast.success("تم تحميل رمز QR");
    } catch (error) {
      console.error("QR download failed:", error);

      toast.error("تعذر تحميل رمز QR");
    } finally {
      setIsDownloading(false);
    }
  }

  const registrationUrl = event ? getPublicRegistrationUrl(event.id) : "";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="QR رابط التسجيل"
      description={event ? event.titleAr : "رابط التسجيل العام للفعالية"}
      className="max-w-xl"
      footer={
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            إغلاق
          </Button>

          {event ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => onCopy(event.id)}
            >
              <Copy className="h-4 w-4" />
              نسخ الرابط
            </Button>
          ) : null}

          {event ? (
            <Button
              type="button"
              variant="outline"
              disabled={isDownloading}
              onClick={handleDownloadQr}
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}

              {isDownloading ? "جاري التحميل..." : "تحميل QR"}
            </Button>
          ) : null}

          {event ? (
            <a
              href={registrationUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#A88042] px-5 text-sm font-extrabold text-white transition hover:bg-[#8F6D37]"
            >
              <ExternalLink className="h-4 w-4" />
              فتح صفحة التسجيل
            </a>
          ) : null}
        </div>
      }
    >
      {event ? (
        <div className="space-y-5 text-center">
          <div className="rounded-[2rem] border border-black/10 bg-[#F8F8FF] p-5">
            <p className="text-sm font-extrabold text-[#A88042]">
              {eventTypeLabels[event.type] || event.type}
            </p>

            <h3 className="mt-2 text-2xl font-extrabold text-[#4B4B4B]">
              {event.titleAr}
            </h3>

            {event.titleEn ? (
              <p dir="ltr" className="mt-1 text-sm font-bold text-[#4B4B4B]/50">
                {event.titleEn}
              </p>
            ) : null}
          </div>

          <div
            ref={qrContainerRef}
            className="mx-auto flex w-fit justify-center rounded-[2rem] border border-black/10 bg-white p-5 shadow-sm"
          >
            <QRCodeSVG
              value={registrationUrl}
              size={260}
              includeMargin
              level="H"
              bgColor="#FFFFFF"
              fgColor="#000000"
            />
          </div>

          <Button
            type="button"
            className="mx-auto"
            disabled={isDownloading}
            onClick={handleDownloadQr}
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}

            {isDownloading ? "جاري تجهيز الصورة..." : "تحميل QR بصيغة PNG"}
          </Button>

          <div className="rounded-2xl border border-black/10 bg-[#F8F8FF] p-4">
            <p className="mb-2 text-xs font-bold text-[#4B4B4B]/50">
              رابط التسجيل
            </p>

            <p
              dir="ltr"
              className="break-all text-center text-sm font-extrabold text-[#4B4B4B]"
            >
              {registrationUrl}
            </p>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
