import type { Metadata } from "next";
import { Almarai } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const almarai = Almarai({
  subsets: ["arabic"],
  weight: ["300", "400", "700", "800"],
  variable: "--font-almarai",
});

export const metadata: Metadata = {
  title: "Creative Event Ops",
  description: "Event operations platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={almarai.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
