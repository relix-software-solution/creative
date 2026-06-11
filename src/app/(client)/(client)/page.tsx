export default function ClientDashboardPage() {
  return (
    <div className="rounded-[2rem] border border-black/10 bg-white p-8 shadow-[0_24px_70px_rgba(0,0,0,0.08)]">
      <p className="text-sm font-extrabold text-[#A88042]">Client Viewer</p>

      <h1 className="mt-2 text-3xl font-extrabold text-[#4B4B4B]">
        لوحة متابعة العميل
      </h1>

      <p className="mt-3 max-w-2xl text-sm font-bold leading-7 text-[#4B4B4B]/60">
        هنا سنعرض لاحقًا فعاليات العميل، أعداد التسجيلات، الحضور، وحركة الدخول
        حسب الصلاحيات المسموحة لهذا الحساب.
      </p>
    </div>
  );
}
