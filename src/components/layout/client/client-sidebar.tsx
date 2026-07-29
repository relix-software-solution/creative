"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  Home,
  ShieldCheck,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ClientLogo } from "./client-logo";

type ClientSidebarProps = {
  mobileOpen: boolean;
  onMobileClose: () => void;
};

const navigationItems = [
  {
    title: "الرئيسية",
    description: "ملخص الأداء",
    href: "/client",
    icon: Home,
    exact: true,
  },
  {
    title: "الفعاليات",
    description: "الفعاليات والتفاصيل",
    href: "/client/events",
    icon: CalendarDays,
  },
  {
    title: "التسجيلات",
    description: "الزوار وحالة الحضور",
    href: "/client/registrations",
    icon: ClipboardList,
  },
  {
    title: "التحليلات",
    description: "المؤشرات والرسوم",
    href: "/client/analytics",
    icon: BarChart3,
  },
] as const;

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="relative flex h-full flex-col">
      <div className="shrink-0 border-b border-white/10 px-6 py-6">
        <ClientLogo />
      </div>

      <div className="px-5 pt-6">
        <p className="px-3 text-[11px] font-extrabold uppercase tracking-[0.16em] text-white/35">
          مساحة العميل
        </p>
      </div>

      <nav className="custom-scrollbar flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            "exact" in item && item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition",
                isActive
                  ? "border-[#A88042]/40 bg-[#A88042] text-white shadow-lg shadow-[#A88042]/20"
                  : "border-transparent text-white/70 hover:border-white/10 hover:bg-white/[0.07] hover:text-white",
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition",
                  isActive
                    ? "bg-white/15 text-white"
                    : "bg-white/[0.06] text-white/45 group-hover:text-[#C59B55]",
                )}
              >
                <Icon className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold">{item.title}</p>
                <p
                  className={cn(
                    "mt-1 truncate text-[11px] font-bold",
                    isActive ? "text-white/70" : "text-white/35",
                  )}
                >
                  {item.description}
                </p>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mx-4 mb-5 shrink-0 rounded-3xl border border-white/10 bg-white/[0.06] p-4">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#A88042]/20 text-[#C59B55]">
          <ShieldCheck className="h-5 w-5" />
        </div>

        <p className="text-sm font-extrabold text-white">
          بياناتك معزولة وآمنة
        </p>
        <p className="mt-1 text-xs font-bold leading-6 text-white/45">
          تعرض هذه البوابة الفعاليات والتسجيلات المرتبطة بحساب عميلك فقط.
        </p>
      </div>
    </div>
  );
}

export function ClientSidebar({
  mobileOpen,
  onMobileClose,
}: ClientSidebarProps) {
  return (
    <>
      <aside className="fixed right-0 top-0 z-50 hidden h-screen w-72 overflow-hidden border-l border-white/10 bg-black text-white lg:block">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,128,66,0.2),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_30%)]" />
        <SidebarContent />
      </aside>

      <div
        aria-hidden={!mobileOpen}
        className={cn(
          "fixed inset-0 z-[70] lg:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <button
          type="button"
          aria-label="إغلاق القائمة"
          onClick={onMobileClose}
          className={cn(
            "absolute inset-0 bg-black/55 backdrop-blur-sm transition-opacity",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
        />

        <aside
          className={cn(
            "absolute right-0 top-0 h-full w-[min(88vw,19rem)] overflow-hidden border-l border-white/10 bg-black text-white shadow-2xl transition-transform duration-300",
            mobileOpen ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,128,66,0.22),transparent_30%)]" />

          <button
            type="button"
            onClick={onMobileClose}
            aria-label="إغلاق القائمة"
            className="absolute left-4 top-5 z-20 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white transition hover:border-[#A88042]/60 hover:text-[#C59B55]"
          >
            <X className="h-5 w-5" />
          </button>

          <SidebarContent onNavigate={onMobileClose} />
        </aside>
      </div>
    </>
  );
}
