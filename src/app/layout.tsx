import type { Metadata } from "next";
import { Almarai } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";
import { PwaRegister } from "@/components/pwa/PwaRegister";

const almarai = Almarai({
  subsets: ["arabic"],
  weight: ["300", "400", "700", "800"],
  variable: "--font-almarai",
});

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
      <body className={almarai.className}>
        <PwaRegister />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
