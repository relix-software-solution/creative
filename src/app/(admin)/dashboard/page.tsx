import {
  Activity,
  ArrowUpLeft,
  CalendarDays,
  CheckCircle2,
  MonitorSmartphone,
  Plus,
  QrCode,
  TrendingUp,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const stats = [
  {
    title: "إجمالي الفعاليات",
    value: "24",
    change: "+12%",
    icon: CalendarDays,
  },
  {
    title: "إجمالي التسجيلات",
    value: "18,420",
    change: "+28%",
    icon: Users,
  },
  {
    title: "حضور اليوم",
    value: "3,245",
    change: "+18%",
    icon: CheckCircle2,
  },
  {
    title: "عمليات المسح",
    value: "41,908",
    change: "+36%",
    icon: QrCode,
  },
  {
    title: "الأجهزة النشطة",
    value: "86",
    change: "+9%",
    icon: MonitorSmartphone,
  },
];

const recentRegistrations = [
  {
    name: "محمد الأحمد",
    phone: "+963944123456",
    type: "زائر",
    event: "معرض دمشق الدولي",
    status: "مؤكد",
  },
  {
    name: "سارة الخطيب",
    phone: "+963933458888",
    type: "VIP",
    event: "مؤتمر التحول الرقمي",
    status: "تم إرسال QR",
  },
  {
    name: "أحمد منصور",
    phone: "+963955112233",
    type: "عارض",
    event: "Expo Tech",
    status: "بانتظار QR",
  },
  {
    name: "ليان يوسف",
    phone: "+963944772211",
    type: "متحدث",
    event: "قمة الابتكار",
    status: "مؤكد",
  },
];

const movementHours = [30, 55, 42, 72, 64, 85, 60, 92, 74, 56, 68, 48];

function getStatusVariant(status: string) {
  if (status === "مؤكد") return "success";
  if (status === "تم إرسال QR") return "gold";
  return "warning";
}

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Creative Group For Event Services"
        title="لوحة التحكم التشغيلية"
        description="نظرة شاملة على الفعاليات، التسجيلات، أجهزة السكانر، وحركة الدخول والخروج ضمن منصة تشغيل واحدة."
        actions={
          <>
            <Button variant="outline">عرض التقارير</Button>
            <Button>
              <Plus className="h-4 w-4" />
              إضافة فعالية
            </Button>
          </>
        }
      />

      <section className="relative max-w-full overflow-hidden rounded-[2.5rem] bg-black p-6 text-white shadow-[0_30px_90px_rgba(0,0,0,0.22)] lg:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(168,128,66,0.35),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.09),transparent_28%),linear-gradient(135deg,rgba(168,128,66,0.08),transparent_55%)]" />
        <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full border border-[#A88042]/20" />
        <div className="absolute -left-10 -top-10 h-60 w-60 rounded-full border border-[#A88042]/20" />
        <div className="absolute left-12 top-16 h-2 w-2 rounded-full bg-[#A88042]" />
        <div className="absolute left-24 top-24 h-3 w-3 rounded-full bg-[#A88042]/70" />
        <div className="absolute left-36 top-12 h-1.5 w-1.5 rounded-full bg-[#A88042]/60" />

        <div className="relative grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)] lg:items-center">
          <div>
            <Badge className="mb-5 border border-[#A88042]/30 bg-[#A88042]/15 text-[#D6B06E] ring-0">
              منصة تشغيل الفعاليات والمعارض
            </Badge>

            <h1 className="max-w-4xl break-words text-3xl font-extrabold leading-tight text-white lg:text-5xl">
              إدارة راقية للفعاليات، التسجيلات، نقاط الدخول، والتحقق عبر QR.
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-8 text-white/65 lg:text-base">
              لوحة تشغيل احترافية بهوية Creative Group، مصممة لمتابعة الحضور
              لحظيًا، إدارة الأجهزة، وتحليل الأداء التشغيلي لكل فعالية.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button>
                <Plus className="h-4 w-4" />
                إضافة فعالية جديدة
              </Button>

              <Button
                variant="outline"
                className="border-white/15 bg-white/10 text-white hover:border-[#A88042] hover:bg-[#A88042]/20 hover:text-white"
              >
                استعراض الأداء
                <ArrowUpLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-white/55">نشاط اليوم</p>
                <h3 className="mt-1 text-2xl font-extrabold text-white">
                  مباشر الآن
                </h3>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#A88042] text-white shadow-lg shadow-[#A88042]/25">
                <Activity className="h-6 w-6" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/55">نسبة الدخول</span>
                  <span className="font-extrabold text-[#D6B06E]">78%</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-white/10">
                  <div className="h-2 w-[78%] rounded-full bg-[#A88042]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                  <p className="text-xs text-white/50">آخر ساعة</p>
                  <p className="mt-2 text-2xl font-extrabold">642</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                  <p className="text-xs text-white/50">نقاط نشطة</p>
                  <p className="mt-2 text-2xl font-extrabold">14</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card
              key={stat.title}
              className="group p-5 transition duration-300 hover:-translate-y-1 hover:border-[#A88042]/40 hover:shadow-[0_26px_80px_rgba(168,128,66,0.16)]"
            >
              <div className="mb-5 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042] transition group-hover:bg-[#A88042] group-hover:text-white">
                  <Icon className="h-6 w-6" />
                </div>

                <Badge variant="success" className="gap-1">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {stat.change}
                </Badge>
              </div>

              <p className="text-sm font-bold text-[#4B4B4B]/60">
                {stat.title}
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-[#4B4B4B]">
                {stat.value}
              </h3>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <Card>
          <CardContent>
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <CardTitle>الحركات حسب الساعة</CardTitle>
                <CardDescription>
                  عرض بصري مبدئي لحركة الدخول والخروج خلال اليوم.
                </CardDescription>
              </div>

              <Badge variant="gold">اليوم</Badge>
            </div>

            <div className="flex h-80 items-end gap-3 rounded-[1.5rem] border border-black/5 bg-[#F8F8FF] p-5">
              {movementHours.map((height, index) => (
                <div
                  key={index}
                  className="flex flex-1 flex-col items-center gap-3"
                >
                  <div
                    className="w-full rounded-t-2xl bg-black transition duration-300 hover:bg-[#A88042]"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-xs font-bold text-[#4B4B4B]/45">
                    {index + 8}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="mb-6">
              <CardTitle>آخر التسجيلات</CardTitle>
              <CardDescription>
                أحدث الأشخاص المسجلين ضمن الفعاليات.
              </CardDescription>
            </div>

            <div className="space-y-3">
              {recentRegistrations.map((registration) => (
                <div
                  key={registration.phone}
                  className="rounded-2xl border border-black/10 bg-[#F8F8FF] p-4 transition hover:border-[#A88042]/40 hover:bg-[#A88042]/5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-extrabold text-[#4B4B4B]">
                        {registration.name}
                      </h3>
                      <p className="mt-1 text-sm font-bold text-[#4B4B4B]/55">
                        {registration.phone}
                      </p>
                    </div>

                    <Badge variant="gold">{registration.type}</Badge>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                    <span className="font-bold text-[#4B4B4B]/55">
                      {registration.event}
                    </span>
                    <Badge variant={getStatusVariant(registration.status)}>
                      {registration.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardContent>
          <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>ملخص التسجيلات الأخيرة</CardTitle>
              <CardDescription>
                جدول مختصر سيُربط لاحقًا مع endpoint التسجيلات من الباك.
              </CardDescription>
            </div>
            <Button variant="outline">عرض كل التسجيلات</Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>الهاتف</TableHead>
                <TableHead>نوع الحضور</TableHead>
                <TableHead>الفعالية</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {recentRegistrations.map((registration) => (
                <TableRow key={registration.phone}>
                  <TableCell>{registration.name}</TableCell>
                  <TableCell dir="ltr" className="text-right">
                    {registration.phone}
                  </TableCell>
                  <TableCell>
                    <Badge variant="gold">{registration.type}</Badge>
                  </TableCell>
                  <TableCell>{registration.event}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(registration.status)}>
                      {registration.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
