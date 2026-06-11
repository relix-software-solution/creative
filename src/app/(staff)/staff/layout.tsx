import Link from "next/link";
import { ReactNode } from "react";
import { QrCode, RefreshCw, ShieldCheck } from "lucide-react";
import { RoleGuard } from "@/components/auth/role-guard";
import { USER_ROLES } from "@/lib/auth/roles";

export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard
      allowedRoles={[
        USER_ROLES.SUPER_ADMIN,
        USER_ROLES.ADMIN,
        USER_ROLES.STAFF,
      ]}
    >
      <main className="min-h-screen bg-[#F8F8FF] text-[#4B4B4B]">
        <header className="sticky top-0 z-40 border-b border-black/10 bg-white/90 backdrop-blur-xl">
          <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 lg:px-8">
            <Link href="/staff/scanner" className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-[#C59B55]">
                <ShieldCheck className="h-6 w-6" />
              </div>

              <div>
                <p className="text-base font-extrabold">Staff Scanner</p>
                <p className="text-xs font-bold text-[#A88042]">Scan QR Only</p>
              </div>
            </Link>

            <nav className="flex items-center gap-2">
              <Link
                href="/staff/scanner"
                className="inline-flex h-11 items-center gap-2 rounded-2xl bg-black px-4 text-sm font-extrabold text-white transition hover:bg-[#4B4B4B]"
              >
                <QrCode className="h-4 w-4" />
                السكانر
              </Link>

              <Link
                href="/staff/sync"
                className="inline-flex h-11 items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 text-sm font-extrabold text-[#4B4B4B] transition hover:border-[#A88042]/50 hover:text-[#A88042]"
              >
                <RefreshCw className="h-4 w-4" />
                المزامنة
              </Link>
            </nav>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">{children}</div>
      </main>
    </RoleGuard>
  );
}
