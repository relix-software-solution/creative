"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  ClipboardList,
  Clock3,
  DoorOpen,
  FileInput,
  Home,
  Layers3,
  MapPinned,
  MonitorSmartphone,
  QrCode,
  Settings,
  ShieldCheck,
  Tags,
  UploadCloud,
  UserCheck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { AdminLogo } from "./admin-logo";

const navigationGroups = [
  {
    title: "عام",
    items: [{ title: "الرئيسية", href: "/dashboard", icon: Home }],
  },
  {
    title: "إدارة الفعاليات",
    items: [
      { title: "العملاء", href: "/clients", icon: Building2 },
      { title: "الفعاليات", href: "/events", icon: CalendarDays },
      { title: "الأماكن", href: "/venues", icon: MapPinned },
      { title: "المناطق", href: "/zones", icon: Layers3 },
      { title: "نقاط الدخول", href: "/checkpoints", icon: DoorOpen },
    ],
  },
  {
    title: "التسجيل",
    items: [
      { title: "أنواع الحضور", href: "/attendee-types", icon: Tags },
      {
        title: "حقول التسجيل",
        href: "/registration-fields",
        icon: FileInput,
      },
      { title: "التسجيلات", href: "/registrations", icon: ClipboardList },
      { title: "الاستيراد", href: "/imports", icon: UploadCloud },
    ],
  },
  {
    title: "التشغيل",
    items: [
      { title: "الأجهزة", href: "/devices", icon: MonitorSmartphone },
      {
        title: "تكليفات الموظفين",
        href: "/staff-assignments",
        icon: UserCheck,
      },
      { title: "جلسات الموظفين", href: "/staff-sessions", icon: Clock3 },
      { title: "إدارة QR", href: "/qr", icon: QrCode },
    ],
  },
  {
    title: "النظام",
    items: [
      { title: "المستخدمون", href: "/users", icon: Users },
      { title: "التقارير", href: "/reports", icon: BarChart3 },
      { title: "الإشعارات", href: "/notifications", icon: Bell },
      { title: "الإعدادات", href: "/settings", icon: Settings },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed right-0 top-0 z-50 hidden h-screen w-72 overflow-hidden border-l border-white/10 bg-black text-white lg:block">
      <div className="absolute inset-0 " />

      <div className="relative flex h-full flex-col">
        <div className="shrink-0 border-b border-white/10 px-6 py-6">
          <AdminLogo />
        </div>

        <nav className="custom-scrollbar flex-1 space-y-6 overflow-y-auto px-4 py-5">
          {navigationGroups.map((group) => (
            <div key={group.title} className="space-y-2">
              <p className="px-4 text-[11px] font-extrabold uppercase tracking-wide text-white/35">
                {group.title}
              </p>

              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

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
                          "h-5 w-5 shrink-0 transition",
                          isActive
                            ? "text-white"
                            : "text-white/42 group-hover:text-[#C59B55]",
                        )}
                      />

                      <span className="truncate">{item.title}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="relative mx-4 mb-5 shrink-0 rounded-3xl border border-white/10 bg-white/[0.06] p-4">
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
