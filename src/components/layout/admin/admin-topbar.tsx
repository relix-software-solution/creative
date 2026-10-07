"use client";

import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronDown,
  Clock3,
  ExternalLink,
  LogOut,
  Menu,
  Search,
  Send,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAdminSettings } from "@/features/admin-settings/admin-settings.queries";
import { useLogout } from "@/features/auth/use-logout";
import {
  useNotificationLogs,
  useNotificationSummary,
} from "@/features/notifications/notification-center.queries";
import type {
  NotificationLogItem,
  NotificationStatus,
} from "@/features/notifications/notification-center.types";
import { useAuthStore } from "@/stores/auth-store";

const statusLabels: Record<NotificationStatus, string> = {
  PENDING: "بانتظار الإرسال",
  SENT: "تم الإرسال",
  DELIVERED: "تم التسليم",
  FAILED: "فشل",
  CANCELLED: "ملغى",
};

function formatRelative(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diffMinutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60_000));
  if (diffMinutes < 1) return "الآن";
  if (diffMinutes < 60) return `منذ ${diffMinutes} د`;
  const hours = Math.floor(diffMinutes / 60);
  if (hours < 24) return `منذ ${hours} س`;
  return new Intl.DateTimeFormat("ar-SY", { day: "2-digit", month: "short" }).format(date);
}

function NotificationStatusIcon({ status }: { status: NotificationStatus }) {
  if (status === "FAILED") return <AlertTriangle className="h-4 w-4 text-red-400" />;
  if (status === "DELIVERED") return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
  if (status === "PENDING") return <Clock3 className="h-4 w-4 text-amber-300" />;
  return <Send className="h-4 w-4 text-[#D6B06A]" />;
}

function NotificationRow({ item }: { item: NotificationLogItem }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.05] p-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.06]">
          <NotificationStatusIcon status={item.status} />
        </div>
        <div className="min-w-0 flex-1 text-right">
          <div className="flex items-center justify-between gap-2">
            <span className={`text-[11px] font-extrabold ${item.status === "FAILED" ? "text-red-300" : "text-white/60"}`}>
              {statusLabels[item.status]}
            </span>
            <span className="text-[10px] font-bold text-white/35">{formatRelative(item.createdAt)}</span>
          </div>
          <p className="mt-1 truncate text-xs font-extrabold text-white">
            {item.registration?.fullName || item.recipient}
          </p>
          <p className="mt-1 truncate text-[11px] text-white/45">
            {item.event?.titleAr || item.notificationType || item.channel}
          </p>
          {item.status === "FAILED" && item.errorMessage ? (
            <p className="mt-2 line-clamp-2 text-[10px] leading-5 text-red-300/80">{item.errorMessage}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function AdminTopbar() {
  const user = useAuthStore((state) => state.user);
  const logoutMutation = useLogout();
  const settingsQuery = useAdminSettings();
  const pollingMs = Math.max((settingsQuery.data?.notificationPollingSeconds ?? 30) * 1000, 10_000);

  const summaryQuery = useNotificationSummary({}, pollingMs);
  const logsQuery = useNotificationLogs({ page: 1, limit: 6 }, pollingMs);

  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const notificationsRef = useRef<HTMLDivElement | null>(null);

  const alertCount = useMemo(() => {
    const summary = summaryQuery.data;
    if (!summary) return 0;
    return summary.recentFailedCount + summary.statuses.pending;
  }, [summaryQuery.data]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (profileRef.current && !profileRef.current.contains(target)) {
        setProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setNotificationsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setProfileOpen(false);
        setNotificationsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleLogout() {
    setProfileOpen(false);
    logoutMutation.mutate();
  }

  return (
    <header className="relative z-40 shrink-0 border-b border-white/10 bg-black text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_left,rgba(168,128,66,0.18),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent)]" />

      <div className="relative flex h-20 items-center justify-between gap-4 px-4 lg:px-8">
        <div className="flex items-center gap-3">
          <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white lg:hidden">
            <Menu className="h-5 w-5" />
          </button>

          <div>
            <p className="text-xs font-bold text-[#C59B55]">
              {settingsQuery.data?.organizationName ?? "Creative Group For Event Services"}
            </p>
            <h2 className="mt-1 text-xl font-extrabold text-white">لوحة التحكم</h2>
          </div>
        </div>

        <div className="hidden flex-1 items-center justify-center px-8 md:flex">
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/35" />
            <input
              placeholder="ابحث عن فعالية، تسجيل، عميل..."
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.08] pr-12 pl-4 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[#A88042] focus:ring-4 focus:ring-[#A88042]/15"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div ref={notificationsRef} className="relative">
            <button
              type="button"
              aria-label="الإشعارات"
              onClick={() => {
                setNotificationsOpen((value) => !value);
                setProfileOpen(false);
              }}
              className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08] text-white transition hover:border-[#A88042]/60 hover:text-[#C59B55]"
            >
              <Bell className="h-5 w-5" />
              {(summaryQuery.data?.recentCount ?? 0) > 0 ? (
                <span className={`absolute left-1.5 top-1.5 min-w-4 rounded-full px-1 text-center text-[9px] font-black leading-4 ring-2 ring-black ${alertCount > 0 ? "bg-red-500 text-white" : "bg-[#A88042] text-white"}`}>
                  {alertCount > 99 ? "99+" : alertCount || summaryQuery.data?.recentCount}
                </span>
              ) : null}
            </button>

            {notificationsOpen ? (
              <div className="absolute left-0 top-[calc(100%+12px)] z-50 w-[360px] max-w-[calc(100vw-24px)] rounded-3xl border border-white/10 bg-[#0B0B0B] p-3 shadow-[0_28px_90px_rgba(0,0,0,0.42)]" dir="rtl">
                <div className="flex items-start justify-between gap-3 border-b border-white/10 px-2 pb-3">
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-white">مركز الإشعارات</p>
                    <p className="mt-1 text-[11px] font-bold text-white/40">
                      {(summaryQuery.data?.recentCount ?? 0).toLocaleString("ar-SY")} خلال آخر {summaryQuery.data?.windowHours ?? 24} ساعة
                    </p>
                  </div>
                  {summaryQuery.data?.alert ? (
                    <span className="rounded-full bg-red-500/15 px-2.5 py-1 text-[10px] font-extrabold text-red-300">
                      يحتاج متابعة
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-500/12 px-2.5 py-1 text-[10px] font-extrabold text-emerald-300">
                      سليم
                    </span>
                  )}
                </div>

                <div className="custom-scrollbar mt-3 max-h-[420px] space-y-2 overflow-y-auto">
                  {logsQuery.isLoading ? (
                    <div className="py-10 text-center text-xs font-bold text-white/40">جاري تحميل الإشعارات...</div>
                  ) : (logsQuery.data?.items.length ?? 0) === 0 ? (
                    <div className="py-10 text-center text-xs font-bold text-white/40">لا توجد إشعارات حتى الآن.</div>
                  ) : (
                    logsQuery.data?.items.map((item) => <NotificationRow key={item.id} item={item} />)
                  )}
                </div>

                <Link
                  href="/notifications"
                  onClick={() => setNotificationsOpen(false)}
                  className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] text-xs font-extrabold text-white transition hover:border-[#A88042]/50 hover:text-[#D6B06A]"
                >
                  عرض مركز الإشعارات الكامل
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : null}
          </div>

          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setProfileOpen((value) => !value);
                setNotificationsOpen(false);
              }}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.08] px-3 py-2 transition hover:border-[#A88042]/60"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#A88042] text-sm font-extrabold text-white">
                {user?.fullName?.slice(0, 1) ?? "A"}
              </div>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-extrabold text-white">{user?.fullName ?? "Admin"}</p>
                <p className="text-xs text-white/45">{user?.role ?? "SUPER_ADMIN"}</p>
              </div>
              <ChevronDown className={`hidden h-4 w-4 text-white/35 transition sm:block ${profileOpen ? "rotate-180" : ""}`} />
            </button>

            {profileOpen ? (
              <div className="absolute left-0 top-[calc(100%+12px)] z-50 w-56 rounded-2xl border border-white/10 bg-black p-2 opacity-100 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
                <div className="border-b border-white/10 p-3">
                  <p className="text-sm font-extrabold text-white">{user?.fullName ?? "Admin"}</p>
                  <p className="mt-1 truncate text-xs font-bold text-white/50">{user?.email ?? "admin@example.com"}</p>
                </div>
                <button
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                  className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-3 text-sm font-extrabold text-red-400 transition hover:bg-red-500/10 disabled:opacity-60"
                >
                  <LogOut className="h-4 w-4" />
                  تسجيل الخروج
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
