"use client";

import { useEffect, useState } from "react";
import { RefreshCw, WifiOff } from "lucide-react";
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
  getPendingScansCount,
  getQueuedScans,
} from "@/lib/offline/staff-scanner-db";
import { QueuedStaffScan } from "@/features/scans/scans.types";

export default function StaffSyncPage() {
  const [scans, setScans] = useState<QueuedStaffScan[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  async function loadQueue() {
    const [items, pending] = await Promise.all([
      getQueuedScans(),
      getPendingScansCount(),
    ]);

    setScans(items);
    setPendingCount(pending);
  }

  useEffect(() => {
    loadQueue();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Offline Sync"
        title="مزامنة عمليات السكانر"
        description="هنا تظهر عمليات المسح المحفوظة محليًا عند انقطاع الإنترنت."
        actions={
          <Button variant="outline" onClick={loadQueue}>
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm font-bold text-[#4B4B4B]/60">
            العمليات المحفوظة
          </p>
          <h3 className="mt-3 text-3xl font-extrabold text-[#4B4B4B]">
            {scans.length}
          </h3>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-bold text-[#4B4B4B]/60">
            بانتظار المزامنة
          </p>
          <h3 className="mt-3 text-3xl font-extrabold text-[#A88042]">
            {pendingCount}
          </h3>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-bold text-[#4B4B4B]/60">الحالة</p>
          <div className="mt-3">
            <Badge variant={pendingCount > 0 ? "warning" : "success"}>
              {pendingCount > 0 ? "يوجد عمليات معلقة" : "لا يوجد عمليات معلقة"}
            </Badge>
          </div>
        </Card>
      </section>

      <Card>
        <CardContent>
          <div className="mb-6">
            <CardTitle>قائمة العمليات المحلية</CardTitle>
            <CardDescription>
              المزامنة مع الباك سنضيفها في الخطوة التالية عبر sync batch.
            </CardDescription>
          </div>

          {scans.length === 0 ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-[2rem] border border-dashed border-black/10 bg-[#F8F8FF]">
              <div className="max-w-sm text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[2rem] bg-[#A88042]/10 text-[#A88042]">
                  <WifiOff className="h-8 w-8" />
                </div>

                <p className="text-xl font-extrabold text-[#4B4B4B]">
                  لا توجد عمليات محفوظة
                </p>

                <p className="mt-3 text-sm font-bold leading-7 text-[#4B4B4B]/55">
                  عند انقطاع الإنترنت، سيحفظ السكانر العمليات هنا تلقائيًا.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {scans.map((scan) => (
                <div
                  key={scan.id}
                  className="rounded-2xl border border-black/10 bg-[#F8F8FF] p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-extrabold text-[#4B4B4B]">
                        {scan.type} / {scan.status}
                      </p>

                      <p
                        dir="ltr"
                        className="mt-1 break-all text-xs font-bold text-[#4B4B4B]/50"
                      >
                        {scan.operationId}
                      </p>
                    </div>

                    <Badge
                      variant={
                        scan.status === "PENDING"
                          ? "warning"
                          : scan.status === "SYNCED"
                            ? "success"
                            : "danger"
                      }
                    >
                      {scan.status}
                    </Badge>
                  </div>

                  <div className="mt-4 grid gap-2 text-xs font-bold text-[#4B4B4B]/60 md:grid-cols-2">
                    <p dir="ltr">eventId: {scan.eventId}</p>
                    <p dir="ltr">checkpointId: {scan.checkpointId}</p>
                    <p dir="ltr">deviceId: {scan.deviceId}</p>
                    <p dir="ltr">createdAt: {scan.createdAt}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
