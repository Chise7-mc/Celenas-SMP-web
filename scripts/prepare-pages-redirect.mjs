import { lstat, readFile, realpath, unlink, writeFile } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const cloudflareUrl = "https://celenas-smp.pages.dev/";
const oldPagesUrl = "https://chise7-mc.github.io/Celenas-SMP-web/";
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = resolve(repositoryRoot, "out");

function ensureContained(path, parent) {
  const relativePath = relative(parent, path);
  if (
    !relativePath ||
    relativePath.startsWith(`..${sep}`) ||
    relativePath === ".."
  ) {
    throw new Error(
      `Refusing to access a path outside the Pages output: ${path}`,
    );
  }
}

async function requireRegularFile(path) {
  ensureContained(path, outputDirectory);
  const fileStat = await lstat(path);
  if (!fileStat.isFile() || fileStat.isSymbolicLink()) {
    throw new Error(`Expected a regular file in the Pages output: ${path}`);
  }
}

export function createRedirectHtml() {
  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="refresh" content="0; url=${cloudflareUrl}">
    <meta name="robots" content="noindex, follow">
    <meta name="description" content="Celenas SMPの公式サイトはCloudflare Pagesへ移転しました。">
    <link rel="canonical" href="${cloudflareUrl}">
    <title>Celenas SMP — 公式サイト移転のお知らせ</title>
    <script>window.location.replace(${JSON.stringify(cloudflareUrl)});</script>
  </head>
  <body>
    <main>
      <h1>Celenas SMP 公式サイト移転のお知らせ</h1>
      <p>公式サイトは新しいURLへ移転しました。</p>
      <p><a href="${cloudflareUrl}">Celenas SMP 公式サイトへ移動</a></p>
    </main>
  </body>
</html>
`;
}

export async function preparePagesRedirect() {
  const resolvedOutputDirectory = await realpath(outputDirectory);
  ensureContained(resolvedOutputDirectory, repositoryRoot);
  if (resolvedOutputDirectory !== outputDirectory) {
    throw new Error("Refusing to modify a redirected Pages output directory.");
  }

  const indexPath = resolve(outputDirectory, "index.html");
  const sitemapPath = resolve(outputDirectory, "sitemap.xml");
  const notFoundPath = resolve(outputDirectory, "404.html");
  await requireRegularFile(indexPath);
  await requireRegularFile(sitemapPath);

  const originalHtml = await readFile(indexPath, "utf8");
  if (
    !originalHtml.includes(`href="${oldPagesUrl}"`) ||
    !originalHtml.includes('href="/Celenas-SMP-web/_next/static/')
  ) {
    throw new Error(
      "The output is not the verified GitHub Pages export; refusing to alter it.",
    );
  }

  const sitemap = await readFile(sitemapPath, "utf8");
  if (
    !sitemap.includes(`<loc>${oldPagesUrl}</loc>`) ||
    (sitemap.match(/<loc>/g) ?? []).length !== 1
  ) {
    throw new Error(
      "The GitHub Pages sitemap did not match the expected export.",
    );
  }

  const redirectHtml = createRedirectHtml();
  await writeFile(indexPath, redirectHtml, "utf8");
  try {
    await requireRegularFile(notFoundPath);
    await writeFile(notFoundPath, redirectHtml, "utf8");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    await writeFile(notFoundPath, redirectHtml, {
      encoding: "utf8",
      flag: "wx",
    });
  }
  await unlink(sitemapPath);
  console.log("Prepared the GitHub Pages-only Cloudflare redirect artifact.");
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  await preparePagesRedirect();
}
