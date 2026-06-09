"use client";

import { ReactNode } from "react";
import { Toaster } from "sonner";
import { QueryProvider } from "@/lib/query/query-provider";

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      {children}
      <Toaster richColors position="top-center" />
    </QueryProvider>
  );
}
