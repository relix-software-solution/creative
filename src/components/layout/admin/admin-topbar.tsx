"use client";

import { Bell, ChevronDown, LogOut, Menu, Search } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useLogout } from "@/features/auth/use-logout";

export function AdminTopbar() {
  const user = useAuthStore((state) => state.user);
  const logoutMutation = useLogout();

  return (
    <header className="sticky top-0 z-30 border-b border-black/10 bg-[#F8F8FF]/85 backdrop-blur-xl">
      <div className="flex h-20 items-center justify-between gap-4 px-4 lg:px-8">
        <div className="flex items-center gap-3">
          <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-black/10 bg-white text-[#4B4B4B] lg:hidden">
            <Menu className="h-5 w-5" />
          </button>

          <div>
            <p className="text-xs font-bold text-[#A88042]">
              Creative Group For Event Services
            </p>
            <h2 className="mt-1 text-xl font-extrabold text-[#4B4B4B]">
              لوحة التحكم
            </h2>
          </div>
        </div>

        <div className="hidden flex-1 items-center justify-center px-8 md:flex">
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#4B4B4B]/45" />
            <input
              placeholder="ابحث عن فعالية، تسجيل، عميل..."
              className="h-12 w-full rounded-2xl border border-black/10 bg-white pr-12 pl-4 text-sm text-[#4B4B4B] outline-none transition placeholder:text-[#4B4B4B]/40 focus:border-[#A88042] focus:ring-4 focus:ring-[#A88042]/10"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-black/10 bg-white text-[#4B4B4B] transition hover:border-[#A88042]/50 hover:text-[#A88042]">
            <Bell className="h-5 w-5" />
            <span className="absolute left-2 top-2 h-2.5 w-2.5 rounded-full bg-[#A88042] ring-2 ring-white" />
          </button>

          <div className="group relative">
            <button className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-3 py-2 transition hover:border-[#A88042]/50">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-sm font-extrabold text-[#A88042]">
                {user?.fullName?.slice(0, 1) ?? "A"}
              </div>

              <div className="hidden text-right sm:block">
                <p className="text-sm font-extrabold text-[#4B4B4B]">
                  {user?.fullName ?? "Admin"}
                </p>
                <p className="text-xs text-[#4B4B4B]/60">
                  {user?.role ?? "SUPER_ADMIN"}
                </p>
              </div>

              <ChevronDown className="hidden h-4 w-4 text-[#4B4B4B]/45 sm:block" />
            </button>

            <div className="invisible absolute left-0 top-full z-50 mt-3 w-56 translate-y-2 rounded-2xl border border-black/10 bg-white p-2 opacity-0 shadow-[0_24px_70px_rgba(0,0,0,0.12)] transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
              <div className="border-b border-black/10 p-3">
                <p className="text-sm font-extrabold text-[#4B4B4B]">
                  {user?.fullName ?? "Admin"}
                </p>
                <p className="mt-1 text-xs font-bold text-[#4B4B4B]/55">
                  {user?.email ?? "admin@example.com"}
                </p>
              </div>

              <button
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-3 text-sm font-extrabold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" />
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
