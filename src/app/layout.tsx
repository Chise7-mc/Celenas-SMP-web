import type { Metadata } from "next";
import type { ReactNode } from "react";
import { site } from "@/config/site";
import "./globals.css";

const ogImageUrl =
  "https://chise7-mc.github.io/Celenas-SMP-web/og/celenas-og.png";

export const metadata: Metadata = {
  title: "Celenas SMP",
  description: "Minecraftサバイバルコミュニティ",
  openGraph: {
    title: "Celenas SMP",
    description: "Minecraftサバイバルコミュニティ",
    siteName: site.name,
    locale: "ja_JP",
    type: "website",
    url: "https://chise7-mc.github.io/Celenas-SMP-web/",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "Celenas SMP OG image",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Celenas SMP",
    description: "Minecraftサバイバルコミュニティ",
    images: [{ url: ogImageUrl, alt: "Celenas SMP OG image" }],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
