import type { Metadata } from "next";
import type { ReactNode } from "react";
import { site } from "@/config/site";
import "./globals.css";

export const metadata: Metadata = {
  title: `${site.name} | Minecraft コミュニティ`,
  description: site.description,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
