"use client";

import { CalendarDays, RefreshCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function EventStatsCards({
  total,
  pageItemsCount,
  isLoading,
  isFetching,
  onRefresh,
}: {
  total: number;
  pageItemsCount: number;
  isLoading: boolean;
  isFetching: boolean;
  onRefresh: () => void;
}) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      <Card className="overflow-hidden border-black/5 p-5 shadow-sm">
        <p className="text-sm font-bold text-[#4B4B4B]/60">إجمالي الفعاليات</p>

        <div className="mt-3 flex items-center justify-between">
          <h3 className="text-3xl font-extrabold text-[#4B4B4B]">
            {isLoading ? "..." : total}
          </h3>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042]">
            <CalendarDays className="h-6 w-6" />
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden border-black/5 p-5 shadow-sm">
        <p className="text-sm font-bold text-[#4B4B4B]/60">نتائج الصفحة</p>

        <h3 className="mt-3 text-3xl font-extrabold text-[#4B4B4B]">
          {isLoading ? "..." : pageItemsCount}
        </h3>
      </Card>

      <Card className="overflow-hidden border-black/5 p-5 shadow-sm">
        <p className="text-sm font-bold text-[#4B4B4B]/60">حالة البيانات</p>

        <div className="mt-3 flex items-center justify-between gap-3">
          <Badge variant={isFetching ? "warning" : "success"}>
            {isFetching ? "تحديث..." : "مستقرة"}
          </Badge>

          <Button
            size="sm"
            variant="outline"
            onClick={onRefresh}
            disabled={isFetching}
          >
            <RefreshCcw
              className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
            تحديث
          </Button>
        </div>
      </Card>
    </section>
  );
}
