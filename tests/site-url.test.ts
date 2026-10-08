import { describe, expect, it } from "vitest";
import { resolveSiteUrl } from "@/lib/site-url";

describe("resolveSiteUrl", () => {
  it("uses the existing GitHub Pages canonical URL by default", () => {
    expect(resolveSiteUrl({})).toBe(
      "https://chise7-mc.github.io/Celenas-SMP-web/",
    );
  });

  it("keeps the GitHub Pages URL for the Pages build target", () => {
    expect(
      resolveSiteUrl({
        DEPLOY_TARGET: undefined,
        GITHUB_PAGES: "true",
        NEXT_PUBLIC_SITE_URL: "https://preview.invalid/",
      }),
    ).toBe("https://chise7-mc.github.io/Celenas-SMP-web/");
  });

  it("uses a confirmed Cloudflare URL at the domain root", () => {
    expect(
      resolveSiteUrl({
        DEPLOY_TARGET: "cloudflare",
        GITHUB_PAGES: undefined,
        NEXT_PUBLIC_SITE_URL: "https://celenas-preview.invalid",
      }),
    ).toBe("https://celenas-preview.invalid/");
  });

  it("requires a valid root HTTPS URL for Cloudflare", () => {
    expect(() =>
      resolveSiteUrl({
        DEPLOY_TARGET: "cloudflare",
        GITHUB_PAGES: undefined,
        NEXT_PUBLIC_SITE_URL: undefined,
      }),
    ).toThrow("require NEXT_PUBLIC_SITE_URL");
    expect(() =>
      resolveSiteUrl({
        DEPLOY_TARGET: "cloudflare",
        GITHUB_PAGES: undefined,
        NEXT_PUBLIC_SITE_URL: "http://celenas.example/",
      }),
    ).toThrow("HTTPS origin at the domain root");
    expect(() =>
      resolveSiteUrl({
        DEPLOY_TARGET: "cloudflare",
        GITHUB_PAGES: undefined,
        NEXT_PUBLIC_SITE_URL: "https://celenas.example/project/",
      }),
    ).toThrow("HTTPS origin at the domain root");
  });
});
