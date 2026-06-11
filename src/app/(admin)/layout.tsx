import { AdminSidebar } from "@/components/layout/admin/admin-sidebar";
import { AdminTopbar } from "@/components/layout/admin/admin-topbar";
import { RoleGuard } from "@/components/auth/role-guard";
import { USER_ROLES } from "@/lib/auth/roles";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={[USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN]}>
      <div className="min-h-screen overflow-x-hidden bg-[#F8F8FF]">
        <AdminSidebar />

        <div className="min-w-0 lg:mr-72">
          <AdminTopbar />

          <main className="min-w-0 overflow-x-hidden px-4 py-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
