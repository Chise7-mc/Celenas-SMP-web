const githubPagesSiteUrl = "https://chise7-mc.github.io/Celenas-SMP-web/";

type SiteUrlEnvironment = Readonly<Record<string, string | undefined>>;

export function resolveSiteUrl(environment: SiteUrlEnvironment = process.env) {
  if (environment.DEPLOY_TARGET === "cloudflare") {
    const configuredUrl = environment.NEXT_PUBLIC_SITE_URL?.trim();
    if (!configuredUrl) {
      throw new Error(
        "Cloudflare builds require NEXT_PUBLIC_SITE_URL to be the confirmed public URL.",
      );
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(configuredUrl);
    } catch {
      throw new Error("NEXT_PUBLIC_SITE_URL must be an absolute HTTPS URL.");
    }

    if (
      parsedUrl.protocol !== "https:" ||
      parsedUrl.pathname !== "/" ||
      parsedUrl.search ||
      parsedUrl.hash
    ) {
      throw new Error(
        "Cloudflare NEXT_PUBLIC_SITE_URL must be an HTTPS origin at the domain root.",
      );
    }

    return parsedUrl.toString();
  }

  if (environment.GITHUB_PAGES === "true") return githubPagesSiteUrl;

  const configuredUrl = environment.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configuredUrl) return githubPagesSiteUrl;

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(configuredUrl);
  } catch {
    throw new Error("NEXT_PUBLIC_SITE_URL must be an absolute HTTPS URL.");
  }
  if (parsedUrl.protocol !== "https:" || parsedUrl.search || parsedUrl.hash) {
    throw new Error("NEXT_PUBLIC_SITE_URL must be an absolute HTTPS URL.");
  }
  return parsedUrl.toString();
}
