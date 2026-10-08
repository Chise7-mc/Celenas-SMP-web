import { access, readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const basePath = "/Celenas-SMP-web";
const outputDirectory = resolve("out");
const indexPath = resolve(outputDirectory, "index.html");

function fail(message) {
  console.error(`GitHub Pages export verification failed: ${message}`);
  process.exitCode = 1;
}

async function verifyExport() {
  let html;
  try {
    html = await readFile(indexPath, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") {
      fail("out/index.html does not exist; run the Pages static build first.");
      return;
    }
    throw error;
  }

  const logoPath = `${basePath}/brand/celenas-logo-white.png`;
  if (!html.includes(`${basePath}/_next/`)) {
    fail(`Next.js assets do not use ${basePath}/_next/.`);
  }
  if (!html.includes(logoPath)) {
    fail(`The official logo is not referenced at ${logoPath}.`);
  }
  if (/["']\/(?:_next|brand)\//.test(html)) {
    fail("A root-absolute Next.js or public asset path remains in the HTML.");
  }

  const requiredMetadata = [
    "<title>Celenas SMP | Minecraftサバイバルサーバー</title>",
    '<link rel="canonical" href="https://chise7-mc.github.io/Celenas-SMP-web/"',
    'name="description" content="Celenas SMPは、Minecraft Java Edition 26.3で建築・探索・装置づくりを楽しめるサバイバルサーバーです。参加申請はDiscordから受け付けています。"',
    'name="robots" content="index, follow"',
    'property="og:image" content="https://chise7-mc.github.io/Celenas-SMP-web/og/celenas-og.png"',
    'name="twitter:card" content="summary_large_image"',
  ];
  for (const metadata of requiredMetadata) {
    if (!html.includes(metadata)) {
      fail(`Expected SEO metadata is missing: ${metadata}`);
    }
  }

  const sitemapPath = resolve(outputDirectory, "sitemap.xml");
  try {
    const sitemap = await readFile(sitemapPath, "utf8");
    if (
      !sitemap.includes(
        "<loc>https://chise7-mc.github.io/Celenas-SMP-web/</loc>",
      ) ||
      (sitemap.match(/<loc>/g) ?? []).length !== 1
    ) {
      fail("sitemap.xml must contain only the canonical home page URL.");
    }
  } catch (error) {
    if (error?.code === "ENOENT") {
      fail("sitemap.xml is missing from the static export.");
    } else {
      throw error;
    }
  }

  const iconTag = [...html.matchAll(/<link\b[^>]*>/g)]
    .map(([tag]) => tag)
    .find((tag) => /\brel="icon"/.test(tag));
  const iconHref = iconTag?.match(/\bhref="([^"]+)"/)?.[1];
  if (!iconHref?.startsWith(`${basePath}/`)) {
    fail(`The site icon does not use the ${basePath} base path.`);
  }

  const assetPaths = new Set();
  for (const [, value] of html.matchAll(/\b(?:src|href)="([^"]+)"/g)) {
    if (!value.startsWith(`${basePath}/`)) {
      continue;
    }
    const pathname = new URL(value, "https://pages.invalid").pathname;
    if (extname(pathname)) {
      assetPaths.add(pathname);
    }
  }

  for (const pathname of assetPaths) {
    const relativePath = decodeURIComponent(
      pathname.slice(basePath.length + 1),
    );
    const assetPath = resolve(outputDirectory, relativePath);
    if (!assetPath.startsWith(`${outputDirectory}${sep}`)) {
      fail(`An asset path escapes the export directory: ${pathname}`);
      continue;
    }
    try {
      await access(assetPath);
    } catch {
      fail(`The referenced asset is missing from out/: ${pathname}`);
    }
  }

  const logoFilePath = resolve(outputDirectory, "brand/celenas-logo-white.png");
  try {
    await access(logoFilePath);
  } catch {
    fail("The official logo is missing from out/brand/.");
  }

  if (process.exitCode !== 1) {
    console.log(
      `Verified out/index.html, ${assetPaths.size} referenced assets, base path ${basePath}, and the official logo.`,
    );
  }
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  await verifyExport();
}
