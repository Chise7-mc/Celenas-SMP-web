import type { NextConfig } from "next";

const isGitHubPagesBuild = process.env.GITHUB_PAGES === "true";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH;

if (isGitHubPagesBuild && basePath !== "/Celenas-SMP") {
  throw new Error(
    "GitHub Pages builds require NEXT_PUBLIC_BASE_PATH=/Celenas-SMP.",
  );
}

const nextConfig: NextConfig = isGitHubPagesBuild
  ? {
      output: "export",
      basePath: "/Celenas-SMP",
      images: { unoptimized: true },
    }
  : {};

export default nextConfig;
