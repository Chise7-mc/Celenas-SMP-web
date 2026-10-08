import type { NextConfig } from "next";

const isGitHubPagesBuild = process.env.GITHUB_PAGES === "true";
const isCloudflareBuild = process.env.DEPLOY_TARGET === "cloudflare";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH;

if (process.env.DEPLOY_TARGET && !isCloudflareBuild) {
  throw new Error("DEPLOY_TARGET must be cloudflare when set.");
}

if (isGitHubPagesBuild && isCloudflareBuild) {
  throw new Error("Choose either GitHub Pages or Cloudflare for a build.");
}

if (isGitHubPagesBuild && basePath !== "/Celenas-SMP-web") {
  throw new Error(
    "GitHub Pages builds require NEXT_PUBLIC_BASE_PATH=/Celenas-SMP-web.",
  );
}

if (isCloudflareBuild) {
  if (basePath) {
    throw new Error("Cloudflare builds must not set NEXT_PUBLIC_BASE_PATH.");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    throw new Error(
      "Cloudflare builds require NEXT_PUBLIC_SITE_URL to be the confirmed public URL.",
    );
  }

  try {
    const parsedUrl = new URL(siteUrl);
    if (
      parsedUrl.protocol !== "https:" ||
      parsedUrl.pathname !== "/" ||
      parsedUrl.search ||
      parsedUrl.hash
    ) {
      throw new Error();
    }
  } catch {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL for Cloudflare must be an HTTPS origin ending at the domain root.",
    );
  }
}

const nextConfig: NextConfig =
  isGitHubPagesBuild || isCloudflareBuild
    ? {
        output: "export",
        ...(isGitHubPagesBuild ? { basePath: "/Celenas-SMP-web" } : {}),
        images: { unoptimized: true },
      }
    : {};

export default nextConfig;
