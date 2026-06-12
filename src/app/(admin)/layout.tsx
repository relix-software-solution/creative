import { AdminSidebar } from "@/components/layout/admin/admin-sidebar";
import { AdminTopbar } from "@/components/layout/admin/admin-topbar";
import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen overflow-hidden bg-[#F8F8FF]" dir="rtl">
      <AdminSidebar />

      <div className="flex h-screen min-w-0 flex-col lg:mr-72">
        <AdminTopbar />

        <main className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
