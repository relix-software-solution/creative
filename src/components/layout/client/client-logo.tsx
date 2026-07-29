import Link from "next/link";
import { Eye } from "lucide-react";

export function ClientLogo() {
  return (
    <Link href="/client" className="flex items-center gap-3">
      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#A88042] text-white shadow-lg shadow-[#A88042]/25">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.35),transparent_28%),linear-gradient(145deg,transparent,rgba(0,0,0,0.16))]" />
        <Eye className="relative h-6 w-6" />
      </div>

      <div className="min-w-0">
        <h1 className="truncate text-base font-extrabold text-white">
          Creative Group
        </h1>
        <p className="mt-1 truncate text-xs font-bold text-[#C59B55]">
          بوابة متابعة العميل
        </p>
      </div>
    </Link>
  );
}
