"use client";

import { Bell, ChevronDown, LogOut, Menu, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useLogout } from "@/features/auth/use-logout";

export function AdminTopbar() {
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
    <header className="relative z-40 shrink-0 border-b border-white/10 bg-black text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_left,rgba(168,128,66,0.18),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent)]" />

      <div className="relative flex h-20 items-center justify-between gap-4 px-4 lg:px-8">
        <div className="flex items-center gap-3">
          <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white lg:hidden">
            <Menu className="h-5 w-5" />
          </button>

          <div>
            <p className="text-xs font-bold text-[#C59B55]">
              Creative Group For Event Services
            </p>

            <h2 className="mt-1 text-xl font-extrabold text-white">
              لوحة التحكم
            </h2>
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
          <button className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08] text-white transition hover:border-[#A88042]/60 hover:text-[#C59B55]">
            <Bell className="h-5 w-5" />
            <span className="absolute left-2 top-2 h-2.5 w-2.5 rounded-full bg-[#A88042] ring-2 ring-black" />
          </button>

          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((value) => !value)}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.08] px-3 py-2 transition hover:border-[#A88042]/60"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#A88042] text-sm font-extrabold text-white">
                {user?.fullName?.slice(0, 1) ?? "A"}
              </div>

              <div className="hidden text-right sm:block">
                <p className="text-sm font-extrabold text-white">
                  {user?.fullName ?? "Admin"}
                </p>

                <p className="text-xs text-white/45">
                  {user?.role ?? "SUPER_ADMIN"}
                </p>
              </div>

              <ChevronDown
                className={`hidden h-4 w-4 text-white/35 transition sm:block ${
                  profileOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {profileOpen ? (
              <div className="absolute left-0 top-[calc(100%+12px)] z-50 w-56 rounded-2xl border border-white/10 bg-black p-2 opacity-100 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
                <div className="border-b border-white/10 p-3">
                  <p className="text-sm font-extrabold text-white">
                    {user?.fullName ?? "Admin"}
                  </p>

                  <p className="mt-1 truncate text-xs font-bold text-white/50">
                    {user?.email ?? "admin@example.com"}
                  </p>
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
