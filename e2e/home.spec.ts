import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("home exposes honest connection details with no runtime errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const response = await page.goto("/");

  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle("Celenas SMP | Minecraft コミュニティ");
  await expect(
    page.getByRole("heading", { level: 1, name: "Celenas SMP" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "参加案内を見る" }).click();
  await expect(page).toHaveURL(/#join$/);
  await expect(
    page.getByRole("heading", { name: "参加案内", exact: true }),
  ).toBeInViewport();
  await expect(
    page.locator("#join").getByText("サーバーアドレスは準備中です。"),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Discord へ" })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("serves the official Celenas site icon", async ({ page }) => {
  const faviconErrors: string[] = [];
  page.on("response", (response) => {
    const path = new URL(response.url()).pathname;
    if (path.endsWith("/favicon.ico") && response.status() === 404) {
      faviconErrors.push(response.url());
    }
  });
  await page.goto("/");
  const iconHref = await page
    .locator('link[rel="icon"]')
    .first()
    .getAttribute("href");

  expect(iconHref).toBeTruthy();
  const response = await page.request.get(
    new URL(iconHref!, page.url()).toString(),
  );

  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toContain("image/png");
  expect((await response.body()).subarray(0, 8)).toEqual(
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  );
  expect(faviconErrors).toEqual([]);
});

test("keyboard users can skip to main content", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "本文へ移動" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
});

test("uses the canonical logo and keeps unconfirmed content pending", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator('img[src*="celenas-logo-white.png"]')).toHaveCount(
    3,
  );
  await expect(
    page.getByText("サーバールールは現在、管理者確認中です。"),
  ).toBeVisible();
  await expect(page.getByText("ワールドの写真は準備中です。")).toBeVisible();
  await expect(page.getByText("Moonlit base")).toHaveCount(0);
  await expect(page.getByText("Campsite")).toHaveCount(0);
  await expect(page.getByText(/チェストや保護の範囲/)).toHaveCount(0);
});

test("mobile navigation is keyboard-operable and reaches page sections", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Menu" });
  const menu = page.getByRole("navigation", { name: "ページ内" });
  const destinations = [
    ["About", "#about"],
    ["World", "#world"],
    ["Community", "#community"],
    ["Rules", "#rules"],
    ["Gallery", "#gallery"],
    ["Join", "#join"],
  ] as const;

  for (const [label, hash] of destinations) {
    await toggle.focus();
    await page.keyboard.press("Enter");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(menu).toBeVisible();
    await menu.getByRole("link", { name: label }).click();
    await expect(page).toHaveURL(new RegExp(`${hash}$`));
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator(hash)).toBeFocused();
  }
});

test("hero celestial scene is decorative and uses CSS motion", async ({
  page,
}) => {
  await page.goto("/");
  const hero = page.locator(".hero-visual");
  await expect(hero).toHaveAttribute("aria-hidden", "true");
  await expect(page.locator(".celestial-stage")).toHaveCSS(
    "animation-name",
    "celestial-drift",
  );
  await expect(page.locator(".moon-svg")).toHaveAttribute(
    "viewBox",
    "0 0 100 100",
  );
  await expect(page.locator(".moon")).toHaveAttribute("data-phase", /.+/);
  await expect(page.locator(".moon")).toHaveAttribute(
    "data-illumination",
    /^\d\.\d{3}$/,
  );
  await expect(page.locator(".stardust-layer")).toHaveCount(3);
  for (const selector of [".stardust-far", ".stardust-mid", ".stardust-near"]) {
    const dust = page.locator(selector);
    expect(
      await dust.evaluate((layer) => getComputedStyle(layer).animationName),
    ).toMatch(/^stardust-drift-/);
    expect(
      await dust.evaluate((layer) => {
        const animation = layer.getAnimations()[0];
        const duration = animation?.effect?.getTiming().duration;
        if (!animation || typeof duration !== "number") {
          return false;
        }

        animation.pause();
        animation.currentTime = 0;
        const startTransform = getComputedStyle(layer).transform;
        animation.currentTime = duration / 2;
        const driftTransform = getComputedStyle(layer).transform;
        animation.play();

        return startTransform !== driftTransform;
      }),
    ).toBe(true);
  }
  expect(
    await page.locator(".star-twinkle-one").evaluate((star) => {
      return getComputedStyle(star).animationName;
    }),
  ).toBe("star-breathe");
  for (const [selector, duration] of [
    [".orbiting-body-one", "300s"],
    [".orbiting-body-two", "360s"],
    [".orbiting-body-three", "260s"],
  ] as const) {
    const body = page.locator(selector);
    await expect(body).toHaveCSS("animation-name", "orbit-turn");
    await expect(body).toHaveCSS("animation-duration", duration);
  }
  const shadow = page.locator(".planet-shadow-sway");
  await expect(shadow).toHaveCSS("animation-name", "shadow-waver");
  await expect(shadow).toHaveCSS("animation-duration", "300s");
  expect(
    await shadow.evaluate((element) => {
      const animation = element.getAnimations()[0];
      if (!animation) return false;
      animation.pause();
      animation.currentTime = 0;
      const start = getComputedStyle(element).rotate;
      animation.currentTime = 150_000;
      const halfway = getComputedStyle(element).rotate;
      animation.play();
      return start !== halfway;
    }),
  ).toBe(true);
  await expect(page.locator(".aurora-curtains")).toHaveCSS(
    "animation-duration",
    "76s",
  );
  expect(
    await page.locator(".hero").evaluate((hero) => {
      return getComputedStyle(hero, "::after").animationName;
    }),
  ).toBe("hero-ambient-drift");
  expect(
    await page.locator(".hero").evaluate((hero) => {
      return getComputedStyle(hero, "::after").animationDuration;
    }),
  ).toBe("72s");
});

test("has no detectable WCAG AA accessibility violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});

test("supports narrow screens and enlarged text without horizontal overflow", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  for (const width of [320, 375, 430, 768, 1024, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      `expected no horizontal overflow at ${width}px`,
    ).toBe(true);
  }
  await expect(
    page.getByRole("link", { name: "参加案内を見る" }),
  ).toBeVisible();
});

test("respects reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    ),
  ).toBe("auto");
  for (const selector of [
    ".moon",
    ".planet-shadow-sway",
    ".aurora-curtains",
    ".orbiting-body-one",
    ".orbiting-body-two",
    ".orbiting-body-three",
    ".star-twinkle-one",
    ".stardust-far",
    ".stardust-mid",
    ".stardust-near",
  ]) {
    await expect(page.locator(selector)).toHaveCSS("animation-name", "none");
  }
  expect(
    await page.locator(".hero").evaluate((hero) => {
      return getComputedStyle(hero, "::after").animationName;
    }),
  ).toBe("none");
  await expect(page.locator(".moon-svg")).toBeVisible();
  await expect(page.locator(".moon")).toHaveAttribute("data-phase", /.+/);
  await expect(page.locator(".hero-logo")).toBeVisible();
});
