import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "口译小助理",
  description: "口译日程、会后整理、统计与跨设备同步工具",
  manifest: "/app.webmanifest",
  icons: {
    icon: "/assets/pwa/icon-192.png",
    apple: "/assets/pwa/icon-192.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
