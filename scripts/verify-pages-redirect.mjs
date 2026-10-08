import { access, lstat, readFile, realpath } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = resolve(repositoryRoot, "out");
const cloudflareUrl = "https://celenas-smp.pages.dev/";

function fail(message) {
  console.error(`GitHub Pages redirect verification failed: ${message}`);
  process.exitCode = 1;
}

async function verifyRedirect() {
  try {
    const resolvedOutputDirectory = await realpath(outputDirectory);
    const relativePath = relative(repositoryRoot, resolvedOutputDirectory);
    if (
      resolvedOutputDirectory !== outputDirectory ||
      !relativePath ||
      relativePath.startsWith(`..${sep}`) ||
      relativePath === ".."
    ) {
      fail("out/ must be a real directory inside the repository.");
      return;
    }

    const redirectPath = resolve(outputDirectory, "index.html");
    const notFoundPath = resolve(outputDirectory, "404.html");
    for (const path of [redirectPath, notFoundPath]) {
      const fileStat = await lstat(path);
      if (!fileStat.isFile() || fileStat.isSymbolicLink()) {
        fail(`${path} must be a regular file.`);
        return;
      }
    }

    const [indexHtml, notFoundHtml] = await Promise.all([
      readFile(redirectPath, "utf8"),
      readFile(notFoundPath, "utf8"),
    ]);
    const requiredContent = [
      `<meta http-equiv="refresh" content="0; url=${cloudflareUrl}">`,
      `<link rel="canonical" href="${cloudflareUrl}">`,
      `<script>window.location.replace(${JSON.stringify(cloudflareUrl)});</script>`,
      `<a href="${cloudflareUrl}">Celenas SMP 公式サイトへ移動</a>`,
    ];

    for (const [name, html] of [
      ["index.html", indexHtml],
      ["404.html", notFoundHtml],
    ]) {
      for (const content of requiredContent) {
        if (!html.includes(content)) {
          fail(`${name} is missing redirect content: ${content}`);
        }
      }
      if (html.includes("https://chise7-mc.github.io/Celenas-SMP-web/")) {
        fail(`${name} still contains the old canonical URL.`);
      }
    }

    try {
      await access(resolve(outputDirectory, "sitemap.xml"));
      fail("The old Pages sitemap must not be published.");
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }

    if (process.exitCode !== 1) {
      console.log(
        "Verified index.html and 404.html redirect to Cloudflare; no old sitemap is present.",
      );
    }
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}

await verifyRedirect();
