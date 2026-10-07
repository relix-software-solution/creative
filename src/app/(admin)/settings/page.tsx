"use client";

import {
  BellRing,
  FileSpreadsheet,
  Globe2,
  Loader2,
  RefreshCw,
  Save,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import {
  useAdminSettings,
  useUpdateAdminSettings,
} from "@/features/admin-settings/admin-settings.queries";
import type { UpdateAdminSettingsPayload } from "@/features/admin-settings/admin-settings.types";

const TIMEZONES = [
  "Asia/Damascus",
  "Asia/Riyadh",
  "Asia/Dubai",
  "Asia/Amman",
  "Europe/Berlin",
  "UTC",
];

export default function SettingsPage() {
  const settingsQuery = useAdminSettings();
  const updateMutation = useUpdateAdminSettings();
  const [form, setForm] = useState<UpdateAdminSettingsPayload>({});

  useEffect(() => {
    if (!settingsQuery.data) return;
    setForm({
      organizationName: settingsQuery.data.organizationName,
      timezone: settingsQuery.data.timezone,
      defaultLocale: settingsQuery.data.defaultLocale,
      reportExportMaxRows: settingsQuery.data.reportExportMaxRows,
      reportDefaultRangeDays: settingsQuery.data.reportDefaultRangeDays,
      notificationSummaryHours: settingsQuery.data.notificationSummaryHours,
      notificationAlertThreshold: settingsQuery.data.notificationAlertThreshold,
      notificationPollingSeconds: settingsQuery.data.notificationPollingSeconds,
    });
  }, [settingsQuery.data]);

  function setValue<K extends keyof UpdateAdminSettingsPayload>(
    key: K,
    value: UpdateAdminSettingsPayload[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function numberValue(value: string, fallback: number) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  if (settingsQuery.isLoading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center" dir="rtl">
        <Loader2 className="h-9 w-9 animate-spin text-[#A88042]" />
      </div>
    );
  }

  if (settingsQuery.isError || !settingsQuery.data) {
    return (
      <div className="space-y-6" dir="rtl">
        <PageHeader eyebrow="Settings" title="إعدادات النظام" description="إعدادات التشغيل العامة للمنصة." />
        <Card>
          <CardContent className="flex min-h-56 flex-col items-center justify-center gap-4 text-center">
            <Settings2 className="h-10 w-10 text-red-500" />
            <p className="font-extrabold text-[#4B4B4B]">تعذر تحميل الإعدادات.</p>
            <Button variant="outline" onClick={() => settingsQuery.refetch()}>
              <RefreshCw className="h-4 w-4" /> إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        eyebrow="Settings"
        title="إعدادات النظام"
        description="إعدادات مركزية محفوظة في قاعدة البيانات وتستخدمها التقارير والإشعارات ولوحة الإدارة."
        actions={
          <Button
            onClick={() => updateMutation.mutate(form)}
            isLoading={updateMutation.isPending}
          >
            <Save className="h-4 w-4" /> حفظ الإعدادات
          </Button>
        }
      />

      <section className="grid gap-5 xl:grid-cols-3">
        <SettingsCard
          icon={<Globe2 className="h-5 w-5" />}
          title="الإعدادات العامة"
          description="هوية النظام والمنطقة الزمنية واللغة الافتراضية."
        >
          <Input
            label="اسم الجهة / النظام"
            value={form.organizationName ?? ""}
            onChange={(event) => setValue("organizationName", event.target.value)}
          />
          <Select
            label="المنطقة الزمنية"
            value={form.timezone ?? "Asia/Damascus"}
            onChange={(value) => setValue("timezone", value)}
            options={TIMEZONES.map((timezone) => ({ label: timezone, value: timezone }))}
          />
          <Select
            label="اللغة الافتراضية"
            value={form.defaultLocale ?? "ar"}
            onChange={(value) => setValue("defaultLocale", value as "ar" | "en")}
            options={[
              { label: "العربية", value: "ar" },
              { label: "English", value: "en" },
            ]}
          />
        </SettingsCard>

        <SettingsCard
          icon={<FileSpreadsheet className="h-5 w-5" />}
          title="إعدادات التقارير"
          description="حدود Excel والنطاق الافتراضي للتقارير."
        >
          <Input
            label="الحد الأقصى لصفوف كل Sheet"
            type="number"
            min={100}
            max={100000}
            value={form.reportExportMaxRows ?? 10000}
            onChange={(event) =>
              setValue("reportExportMaxRows", numberValue(event.target.value, 10000))
            }
          />
          <Input
            label="النطاق الافتراضي بالأيام"
            type="number"
            min={1}
            max={365}
            value={form.reportDefaultRangeDays ?? 30}
            onChange={(event) =>
              setValue("reportDefaultRangeDays", numberValue(event.target.value, 30))
            }
          />
          <div className="rounded-2xl border border-[#A88042]/15 bg-[#A88042]/[0.06] p-4 text-xs font-bold leading-6 text-[#4B4B4B]/70">
            ملف Excel التشغيلي يحتوي على الملخص، التسجيلات، الحركات، نقاط الدخول وأداء الموظفين حسب فلترة التقرير.
          </div>
        </SettingsCard>

        <SettingsCard
          icon={<BellRing className="h-5 w-5" />}
          title="إعدادات الإشعارات"
          description="حساسية التنبيه وفترة الملخص وتحديث جرس الإشعارات."
        >
          <Input
            label="فترة ملخص الإشعارات (ساعة)"
            type="number"
            min={1}
            max={720}
            value={form.notificationSummaryHours ?? 24}
            onChange={(event) =>
              setValue("notificationSummaryHours", numberValue(event.target.value, 24))
            }
          />
          <Input
            label="حد التنبيه عند فشل الإرسال"
            type="number"
            min={1}
            max={10000}
            value={form.notificationAlertThreshold ?? 1}
            onChange={(event) =>
              setValue("notificationAlertThreshold", numberValue(event.target.value, 1))
            }
          />
          <Input
            label="تحديث الجرس كل (ثانية)"
            type="number"
            min={10}
            max={3600}
            value={form.notificationPollingSeconds ?? 30}
            onChange={(event) =>
              setValue("notificationPollingSeconds", numberValue(event.target.value, 30))
            }
          />
        </SettingsCard>
      </section>

      <Card className="border-black/5 shadow-sm">
        <CardContent className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-black text-[#D6B06A]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>إعدادات إنتاج فعلية</CardTitle>
            <CardDescription className="mt-2 leading-7">
              هذه القيم محفوظة في قاعدة البيانات. لا يتم تعديل مفاتيح API أو كلمات المرور من هذه الصفحة؛ الأسرار تبقى ضمن Environment Variables على السيرفر.
            </CardDescription>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsCard({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="border-black/5 shadow-sm">
      <CardContent className="space-y-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042]">
            {icon}
          </div>
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
