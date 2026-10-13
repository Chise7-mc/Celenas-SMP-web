import { access, readdir, readFile } from "node:fs/promises";
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
    "_headers",
    "_routes.json",
    "brand/celenas-logo-white.png",
    "space/hero-nebula.webp",
    "space/lunar-surface.webp",
    "og/celenas-og.png",
    "icon.png",
    "robots.txt",
    "sitemap.xml",
  ];
  for (const file of requiredFiles) {
    try {
      await access(resolve(outputDirectory, file));
    } catch {
      fail(`Required Cloudflare root asset is missing: ${file}`);
    }
  }

  const headersPath = resolve(outputDirectory, "_headers");
  try {
    const headers = await readFile(headersPath, "utf8");
    const requiredHeaders = [
      "Content-Security-Policy:",
      "Strict-Transport-Security: max-age=31536000",
      "X-Content-Type-Options: nosniff",
      "X-Frame-Options: DENY",
      "Referrer-Policy: strict-origin-when-cross-origin",
      "Permissions-Policy:",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
      "https://challenges.cloudflare.com",
    ];
    for (const header of requiredHeaders) {
      if (!headers.includes(header)) {
        fail(`Cloudflare security headers are missing: ${header}`);
      }
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  const routesPath = resolve(outputDirectory, "_routes.json");
  try {
    const routes = JSON.parse(await readFile(routesPath, "utf8"));
    if (
      routes.version !== 1 ||
      !Array.isArray(routes.include) ||
      routes.include.length !== 1 ||
      routes.include[0] !== "/api/join" ||
      !Array.isArray(routes.exclude) ||
      routes.exclude.length !== 0
    ) {
      fail(
        "Cloudflare Pages Function routing must include only the join API route.",
      );
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
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

  const robotsPath = resolve(outputDirectory, "robots.txt");
  try {
    const robots = await readFile(robotsPath, "utf8");
    if (
      !robots.includes("User-Agent: *") ||
      !robots.includes("Allow: /") ||
      !robots.includes(`${siteUrl.toString()}sitemap.xml`)
    ) {
      fail(
        "robots.txt must allow public pages and identify the canonical sitemap.",
      );
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  if (html.includes("discord.gg/")) {
    fail("The Discord invite must not be included in static page HTML.");
  }

  async function javascriptFiles(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const paths = await Promise.all(
      entries.map(async (entry) => {
        const path = resolve(directory, entry.name);
        return entry.isDirectory()
          ? javascriptFiles(path)
          : extname(entry.name) === ".js"
            ? [path]
            : [];
      }),
    );
    return paths.flat();
  }

  try {
    const files = await javascriptFiles(
      resolve(outputDirectory, "_next/static"),
    );
    for (const file of files) {
      if ((await readFile(file, "utf8")).includes("discord.gg/")) {
        fail(
          "The Discord invite must not be included in published JavaScript.",
        );
        break;
      }
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    fail("Cloudflare JavaScript assets are missing from out/_next/static.");
  }

  if (process.exitCode !== 1) {
    console.log(
      `Verified Cloudflare root export at ${siteUrl.toString()}, ${assetPaths.size} referenced assets, security headers, API routing, SEO metadata and sitemap.`,
    );
  }
}

await verifyExport();
