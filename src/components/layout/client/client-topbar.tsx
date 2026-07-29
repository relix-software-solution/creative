"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  LogOut,
  Menu,
  UserRound,
} from "lucide-react";
import { useLogout } from "@/features/auth/use-logout";
import { useAuthStore } from "@/stores/auth-store";

type ClientTopbarProps = {
  onOpenSidebar: () => void;
};

function getPageTitle(pathname: string) {
  if (pathname.startsWith("/client/events")) return "الفعاليات";
  if (pathname.startsWith("/client/registrations")) return "التسجيلات";
  if (pathname.startsWith("/client/analytics")) return "التحليلات";
  return "النظرة العامة";
}

function getUserInitial(fullName?: string | null) {
  const trimmedName = fullName?.trim();
  return trimmedName ? trimmedName.slice(0, 1).toUpperCase() : "C";
}

export function ClientTopbar({ onOpenSidebar }: ClientTopbarProps) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const logoutMutation = useLogout();

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!profileRef.current) return;
      if (!profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setProfileOpen(false);
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
    <header className="relative z-40 shrink-0 border-b border-black/10 bg-white/90 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_left,rgba(168,128,66,0.1),transparent_35%)]" />

      <div className="relative flex h-20 items-center justify-between gap-3 px-4 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenSidebar}
            aria-label="فتح القائمة"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-black/10 bg-white text-[#4B4B4B] shadow-sm transition hover:border-[#A88042]/50 hover:text-[#A88042] lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <p className="truncate text-xs font-extrabold text-[#A88042]">
              بوابة العميل
            </p>
            <h2 className="mt-1 truncate text-xl font-extrabold text-[#252525]">
              {getPageTitle(pathname)}
            </h2>
          </div>
        </div>

        <div ref={profileRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setProfileOpen((value) => !value)}
            aria-expanded={profileOpen}
            className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-2.5 py-2 shadow-sm transition hover:border-[#A88042]/40 hover:shadow-md sm:px-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-sm font-extrabold text-[#C59B55]">
              {getUserInitial(user?.fullName)}
            </div>

            <div className="hidden max-w-48 text-right sm:block">
              <p className="truncate text-sm font-extrabold text-[#252525]">
                {user?.fullName ?? "حساب العميل"}
              </p>
              <p className="mt-1 truncate text-xs font-bold text-[#4B4B4B]/45">
                {user?.email ?? "CLIENT_VIEWER"}
              </p>
            </div>

            <ChevronDown
              className={`hidden h-4 w-4 text-[#4B4B4B]/40 transition sm:block ${
                profileOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {profileOpen ? (
            <div className="absolute left-0 top-[calc(100%+12px)] z-50 w-64 rounded-3xl border border-black/10 bg-white p-2 shadow-[0_24px_70px_rgba(0,0,0,0.14)]">
              <div className="rounded-2xl bg-[#F8F8FF] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#A88042]/15 text-[#A88042]">
                    <UserRound className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-[#252525]">
                      {user?.fullName ?? "حساب العميل"}
                    </p>
                    <p className="mt-1 truncate text-xs font-bold text-[#4B4B4B]/50">
                      {user?.email ?? "—"}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                className="mt-2 flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-sm font-extrabold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" />
                {logoutMutation.isPending ? "جاري تسجيل الخروج..." : "تسجيل الخروج"}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
