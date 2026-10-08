import { describe, expect, it } from "vitest";
import {
  createRedirectHtml,
  cloudflareUrl,
} from "../scripts/prepare-pages-redirect.mjs";

describe("GitHub Pages redirect artifact", () => {
  it("redirects immediately and retains canonical and manual navigation", () => {
    const html = createRedirectHtml();

    expect(html).toContain(
      `<meta http-equiv="refresh" content="0; url=${cloudflareUrl}">`,
    );
    expect(html).toContain(
      `<script>window.location.replace(${JSON.stringify(cloudflareUrl)});</script>`,
    );
    expect(html).toContain(`<link rel="canonical" href="${cloudflareUrl}">`);
    expect(html).toContain(`<a href="${cloudflareUrl}">`);
    expect(html).toContain('<meta name="robots" content="noindex, follow">');
  });
});
