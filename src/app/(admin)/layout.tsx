import { AdminSidebar } from "@/components/layout/admin/admin-sidebar";
import { AdminTopbar } from "@/components/layout/admin/admin-topbar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F8F8FF]">
      <AdminSidebar />

      <div className="min-w-0 lg:mr-72">
        <AdminTopbar />

        <main className="min-w-0 overflow-x-hidden px-4 py-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
