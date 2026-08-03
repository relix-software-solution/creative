import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";
import { PwaRegister } from "@/components/pwa/PwaRegister";

export const metadata: Metadata = {
  title: "Creative Group",
  description: "Event operations platform",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Scanner",
    statusBarStyle: "default",
  },
};

export const viewport = {
  themeColor: "#A88042",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <PwaRegister />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
