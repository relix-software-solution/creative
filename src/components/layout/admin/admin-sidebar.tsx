"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  ClipboardList,
  Home,
  MonitorSmartphone,
  QrCode,
  Settings,
  ShieldCheck,
  UploadCloud,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { AdminLogo } from "./admin-logo";

const navigationItems = [
  { title: "الرئيسية", href: "/dashboard", icon: Home },
  { title: "العملاء", href: "/clients", icon: Building2 },
  { title: "الفعاليات", href: "/events", icon: CalendarDays },
  { title: "التسجيلات", href: "/registrations", icon: ClipboardList },
  { title: "الأجهزة", href: "/devices", icon: MonitorSmartphone },
  { title: "المستخدمون", href: "/users", icon: Users },
  { title: "السكانر", href: "/scanner", icon: QrCode },
  { title: "الاستيراد", href: "/imports", icon: UploadCloud },
  { title: "التقارير", href: "/reports", icon: BarChart3 },
  { title: "الإشعارات", href: "/notifications", icon: Bell },
  { title: "الإعدادات", href: "/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed right-0 top-0 z-40 hidden h-screen w-72 overflow-hidden bg-black text-white lg:block">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(168,128,66,0.22),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_38%)]" />

      <div className="relative flex h-full flex-col">
        <div className="border-b border-white/10 px-6 py-6">
          <AdminLogo />
        </div>

        <nav className="custom-scrollbar flex-1 space-y-1 overflow-y-auto px-4 py-5">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition",
                  isActive
                    ? "bg-[#A88042] text-white shadow-lg shadow-[#A88042]/25"
                    : "text-white/68 hover:bg-white/10 hover:text-white",
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition",
                    isActive
                      ? "text-white"
                      : "text-white/42 group-hover:text-[#C59B55]",
                  )}
                />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        <div className="relative mx-4 mb-5 rounded-3xl border border-white/10 bg-white/[0.06] p-4">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#A88042]/20 text-[#C59B55]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <p className="text-sm font-extrabold">تشغيل بمعايير فاخرة</p>
          <p className="mt-1 text-xs leading-6 text-white/50">
            إدارة الدخول والتحقق من QR ومراقبة الحركة بتجربة تشغيل احترافية.
          </p>
        </div>
      </div>
    </aside>
  );
}
