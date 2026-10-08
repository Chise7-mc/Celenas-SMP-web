import { access, readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";

const outputDirectory = resolve("out");
const indexPath = resolve(outputDirectory, "index.html");

function fail(message) {
  console.error(`Cloudflare static export verification failed: ${message}`);
  process.exitCode = 1;
}

async function verifyExport() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!configuredUrl) {
    fail("NEXT_PUBLIC_SITE_URL must be the confirmed Cloudflare public URL.");
    return;
  }

  let siteUrl;
  try {
    siteUrl = new URL(configuredUrl);
    if (
      siteUrl.protocol !== "https:" ||
      siteUrl.pathname !== "/" ||
      siteUrl.search ||
      siteUrl.hash
    ) {
      throw new Error();
    }
  } catch {
    fail("NEXT_PUBLIC_SITE_URL must be an HTTPS origin at the domain root.");
    return;
  }

  let html;
  try {
    html = await readFile(indexPath, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") {
      fail("out/index.html does not exist; run the Cloudflare build first.");
      return;
    }
    throw error;
  }

  const expectedMetadata = [
    '<link rel="canonical" href="' + siteUrl.origin + '"',
    'property="og:url" content="' + siteUrl.origin + '"',
    'property="og:image" content="' +
      new URL("og/celenas-og.png", siteUrl).toString() +
      '"',
    'name="twitter:image" content="' +
      new URL("og/celenas-og.png", siteUrl).toString() +
      '"',
    'name="twitter:card" content="summary_large_image"',
  ];
  for (const metadata of expectedMetadata) {
    if (!html.includes(metadata)) fail(`Missing metadata: ${metadata}`);
  }

  if (
    !html.includes('href="/_next/static/') ||
    html.includes("/Celenas-SMP-web/")
  ) {
    fail("HTML assets must use domain-root paths without the Pages base path.");
  }

  const assetPaths = new Set();
  for (const [, value] of html.matchAll(/\b(?:src|href)="([^"#]+)"/g)) {
    if (!value.startsWith("/") || value.startsWith("//")) continue;
    const pathname = new URL(value, "https://export.invalid").pathname;
    if (extname(pathname)) assetPaths.add(pathname);
  }

  for (const pathname of assetPaths) {
    const relativePath = decodeURIComponent(pathname.slice(1));
    const assetPath = resolve(outputDirectory, relativePath);
    if (!assetPath.startsWith(`${outputDirectory}${sep}`)) {
      fail(`An asset path escapes the export directory: ${pathname}`);
      continue;
    }
    try {
      await access(assetPath);
    } catch {
      fail(`A referenced root asset is missing from out/: ${pathname}`);
    }
  }

  const requiredFiles = [
    "brand/celenas-logo-white.png",
    "space/hero-nebula.webp",
    "space/lunar-surface.webp",
    "og/celenas-og.png",
    "icon.png",
    "sitemap.xml",
  ];
  for (const file of requiredFiles) {
    try {
      await access(resolve(outputDirectory, file));
    } catch {
      fail(`Required Cloudflare root asset is missing: ${file}`);
    }
  }

  const sitemapPath = resolve(outputDirectory, "sitemap.xml");
  try {
    const sitemap = await readFile(sitemapPath, "utf8");
    if (
      !sitemap.includes(`<loc>${siteUrl.toString()}</loc>`) ||
      (sitemap.match(/<loc>/g) ?? []).length !== 1
    ) {
      fail("sitemap.xml must contain only the configured canonical URL.");
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  if (!html.includes("https://discord.gg/cuXPVNccYv")) {
    fail("The published Discord invite link is missing from the home page.");
  }

  if (process.exitCode !== 1) {
    console.log(
      `Verified Cloudflare root export at ${siteUrl.toString()}, ${assetPaths.size} referenced assets, SEO metadata, Discord invite and sitemap.`,
    );
  }
}

await verifyExport();
