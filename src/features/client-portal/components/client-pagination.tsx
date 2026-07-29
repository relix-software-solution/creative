"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatClientNumber } from "../client-portal.constants";

type ClientPaginationProps = {
  page: number;
  pages: number;
  total: number;
  limit: number;
  disabled?: boolean;
  onPageChange: (page: number) => void;
};

export function ClientPagination({
  page,
  pages,
  total,
  limit,
  disabled = false,
  onPageChange,
}: ClientPaginationProps) {
  if (total === 0 || pages <= 1) return null;

  const firstItem = (page - 1) * limit + 1;
  const lastItem = Math.min(page * limit, total);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs font-bold text-[#4B4B4B]/55">
        عرض {formatClientNumber(firstItem)}–{formatClientNumber(lastItem)} من{" "}
        {formatClientNumber(total)}
      </p>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronRight className="h-4 w-4" />
          السابق
        </Button>

        <span className="min-w-24 text-center text-xs font-extrabold text-[#4B4B4B]">
          {formatClientNumber(page)} / {formatClientNumber(pages)}
        </span>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          التالي
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
