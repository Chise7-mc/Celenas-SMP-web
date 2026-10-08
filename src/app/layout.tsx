import type { Metadata } from "next";
import type { ReactNode } from "react";
import { site } from "@/config/site";
import { resolveSiteUrl } from "@/lib/site-url";
import "./globals.css";

const siteUrl = resolveSiteUrl();
const ogImageUrl = new URL("og/celenas-og.png", siteUrl).toString();
const searchDescription =
  "Celenas SMPは、Minecraft Java Edition 26.3で建築・探索・装置づくりを楽しめるサバイバルサーバーです。参加申請はDiscordから受け付けています。";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Celenas SMP | Minecraftサバイバルサーバー",
  description: searchDescription,
  alternates: {
    canonical: siteUrl,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Celenas SMP",
    description: "Minecraftサバイバルコミュニティ",
    siteName: site.name,
    locale: "ja_JP",
    type: "website",
    url: siteUrl,
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
