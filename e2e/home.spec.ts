import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function expectFixedNodesVisible(page: Page) {
  const orbital = page.getByRole("navigation", { name: "ページ内セクション" });
  await expect(orbital.locator(".orbital-fixed-node")).toHaveCount(7);
  await expect(orbital.locator(".orbital-active-satellite")).toHaveCount(1);
  await expect
    .poll(() =>
      page.locator(".orbital-fixed-node").evaluateAll((nodes) =>
        nodes.every((node) => {
          const style = getComputedStyle(node);
          return (
            Number(style.opacity) > 0 &&
            style.visibility !== "hidden" &&
            style.display !== "none"
          );
        }),
      ),
    )
    .toBe(true);
}

async function expectMarkerAligned(page: Page, href: string) {
  const orbital = page.getByRole("navigation", { name: "ページ内セクション" });
  if (href === "#hero") {
    await expect(
      orbital.locator('.orbital-section-link[aria-current="location"]'),
    ).toHaveCount(0);
  } else {
    await expect(orbital.locator('a[href="' + href + '"]')).toHaveAttribute(
      "aria-current",
      "location",
    );
  }
  await expectFixedNodesVisible(page);
  await expect
    .poll(() =>
      page.evaluate((targetHref) => {
        const marker = document.querySelector<HTMLElement>(
          ".orbital-active-satellite",
        );
        const node =
          targetHref === "#hero"
            ? document.querySelector<HTMLElement>(
                ".orbital-hero-node .orbital-fixed-node",
              )
            : document
                .querySelector<HTMLAnchorElement>(
                  '.orbital-section-link[href="' + targetHref + '"]',
                )
                ?.querySelector<HTMLElement>(".orbital-fixed-node");
        if (!marker || !node) throw new Error("Missing orbital marker");
        const markerRect = marker.getBoundingClientRect();
        const nodeRect = node.getBoundingClientRect();
        return {
          horizontal:
            Math.abs(
              markerRect.left +
                markerRect.width / 2 -
                (nodeRect.left + nodeRect.width / 2),
            ) <= 1,
          vertical:
            Math.abs(
              markerRect.top +
                markerRect.height / 2 -
                (nodeRect.top + nodeRect.height / 2),
            ) <= 1,
        };
      }, href),
    )
    .toEqual({ horizontal: true, vertical: true });
}

test("home exposes honest connection details with no runtime errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const response = await page.goto("/");

  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle(
    "Celenas SMP | Minecraftサバイバルを、時間とともに",
  );
  await expect(
    page.getByRole("heading", { level: 1, name: "Celenas SMP" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "参加方法を見る" }).click();
  await expect(page).toHaveURL(/#join$/);
  await expect(
    page.getByRole("heading", {
      name: "Celenas SMPに参加する。",
      exact: true,
    }),
  ).toBeInViewport();
  await expect(
    page
      .locator("#join")
      .getByText(
        "Minecraftの接続情報とDiscordの案内は、確認できたものから公開します。",
      ),
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
    page.getByText(
      "正式なルールは準備中です。確定した内容をこちらに掲載します。",
    ),
  ).toBeVisible();
  await expect(page.getByText("景色の記録は準備中です。")).toBeVisible();
  await expect(
    page.getByText("ひとつのMinecraft世界を、みんなで少しずつ育てていく。"),
  ).toBeVisible();
  await expect(
    page.getByText("Minecraftサバイバルを、それぞれのペースで。"),
  ).toBeVisible();
  await expect(page.getByText(/Java版|Bedrock版|whitelist/i)).toHaveCount(0);
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

test("celestial journey navigation and browser history stay accessible", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name === "mobile-chromium",
    "The orbital indicator is intentionally hidden on touch devices.",
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const atmosphere = page.locator(".celestial-journey-atmosphere");
  const orbital = page.getByRole("navigation", { name: "ページ内セクション" });
  await expect(orbital).toBeVisible();
  await expect(orbital.getByRole("link")).toHaveCount(6);
  await expect(atmosphere).toHaveAttribute("data-stage", "hero");
  await expect(page.locator(".orbital-section-path path")).toHaveAttribute(
    "d",
    /^M47 27 C50 43 58 66 67 82 /,
  );

  const destinations = [
    ["01 About", "#about"],
    ["02 World", "#world"],
    ["03 Community", "#community"],
    ["04 Rules", "#rules"],
    ["05 Gallery", "#gallery"],
    ["06 Join", "#join"],
  ] as const;

  for (const [name, hash] of destinations) {
    const link = orbital.getByRole("link", { name });
    await link.click();
    await expect(page).toHaveURL(new RegExp(`${hash}$`));
    await expect(page.locator(hash)).toBeFocused();
    await expect(link).toHaveAttribute("aria-current", "location");
    await expect(atmosphere).toHaveAttribute("data-stage", hash.slice(1));
  }

  await page.goBack();
  await expect(page).toHaveURL(/#gallery$/);
  await expect(page.locator("#gallery")).toBeFocused();
  await expect(atmosphere).toHaveAttribute("data-stage", "gallery");
  await page.goForward();
  await expect(page).toHaveURL(/#join$/);
  await expect(page.locator("#join")).toBeFocused();

  await page.goto("/");
  await expect(atmosphere).toHaveAttribute("data-stage", "hero");
});

test("orbital marker stays aligned across desktop viewports", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name === "mobile-chromium",
    "The orbital indicator is intentionally hidden on touch devices.",
  );
  for (const [width, height] of [
    [1920, 1080],
    [1440, 900],
    [1366, 768],
  ] as const) {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    const orbital = page.getByRole("navigation", {
      name: "ページ内セクション",
    });
    await expect(orbital).toBeVisible();
    await expect(orbital.getByRole("link")).toHaveCount(6);
    await expectMarkerAligned(page, "#hero");
    for (const href of ["#about", "#world", "#gallery", "#join"]) {
      await orbital.locator('a[href="' + href + '"]').click();
      await expectMarkerAligned(page, href);
    }
  }
});

test("celestial journey supports direct hashes and keeps mobile navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#gallery");
  await expect(page.locator("#gallery")).toBeInViewport();
  await expect(page.locator(".celestial-journey-atmosphere")).toHaveAttribute(
    "data-stage",
    "gallery",
  );
  await expect(
    page.getByRole("navigation", { name: "メインナビゲーション" }),
  ).toBeVisible();

  await page.setViewportSize({ width: 375, height: 812 });
  await expect(
    page.getByRole("navigation", { name: "ページ内セクション" }),
  ).toBeHidden();
  const toggle = page.getByRole("button", { name: "Menu" });
  await toggle.click();
  await expect(
    page.getByRole("navigation", { name: "ページ内" }),
  ).toBeVisible();
});

test("transmission uses truthful pending state and distinguishes Join access", async ({
  page,
}) => {
  await page.goto("/");
  const community = page.locator(".transmission-panel-community");
  await expect(community).toHaveAttribute("data-state", "pending");
  await expect(community.getByText("PENDING", { exact: true })).toBeVisible();
  await expect(community.getByText(/PUBLIC LINK \/ PENDING/)).toBeVisible();
  await expect(page.locator(".transmission-panel-join")).toContainText(
    "PUBLIC ACCESS / PENDING",
  );
  await expect(
    page.locator(".transmission-panel-join").getByRole("link"),
  ).toHaveCount(0);
  await expect(
    page.getByText(/PING|LATENCY|UPTIME|PLAYER\s+\d|SIGNAL\s+\d/i),
  ).toHaveCount(0);
});

test("keeps the orbital indicator within desktop bounds and hides it on smaller screens", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  const orbital = page.getByRole("navigation", { name: "ページ内セクション" });
  const touchDevice = testInfo.project.name === "mobile-chromium";
  for (const width of [1440, 1200]) {
    await page.setViewportSize({ width, height: 900 });
    if (touchDevice) {
      await expect(orbital).toBeHidden();
    } else {
      await expect(orbital).toBeVisible();
    }
    await expect(
      page.getByRole("navigation", { name: "メインナビゲーション" }),
    ).toBeVisible();
    if (touchDevice) continue;
    expect(
      await orbital.getByRole("link", { name: "06 Join" }).evaluate((node) => {
        const right = node.getBoundingClientRect().right;
        const navigationRight = node
          .closest("nav")!
          .getBoundingClientRect().right;
        return right <= navigationRight;
      }),
    ).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  for (const [width, height] of [
    [1024, 900],
    [768, 900],
    [390, 844],
  ] as const) {
    await page.setViewportSize({ width, height });
    await expect(orbital).toBeHidden();
    if (width > 768) {
      await expect(
        page.getByRole("navigation", { name: "メインナビゲーション" }),
      ).toBeVisible();
    } else {
      await expect(page.getByRole("button", { name: "Menu" })).toBeVisible();
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
});

test("hero celestial scene is decorative and uses CSS motion", async ({
  page,
}) => {
  await page.goto("/");
  const hero = page.locator(".hero-visual");
  const mobilePerformanceMode = await page.evaluate(
    () => matchMedia("(max-width: 48rem), (pointer: coarse)").matches,
  );
  await expect(hero).toHaveAttribute("aria-hidden", "true");
  await expect(page.locator(".celestial-stage")).toHaveCSS(
    "animation-name",
    "none",
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
  const movingDust = page.locator(".stardust-mid");
  await expect(movingDust).toHaveCSS(
    "animation-name",
    mobilePerformanceMode ? "none" : "stardust-drift-mid",
  );
  if (!mobilePerformanceMode) {
    expect(
      await movingDust.evaluate((layer) => {
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
  await expect(page.locator(".stardust-near")).toHaveCSS(
    "animation-name",
    "none",
  );
  await expect(page.locator(".stardust-far")).toHaveCSS(
    "animation-name",
    "none",
  );
  for (const dust of await page.locator(".stardust-layer").all()) {
    await expect(dust).toHaveCSS("will-change", "auto");
  }
  expect(
    await page.locator(".star-twinkle-one").evaluate((star) => {
      return getComputedStyle(star).animationName;
    }),
  ).toBe(mobilePerformanceMode ? "none" : "star-breathe");
  await expect(page.locator(".star-twinkle-two")).toHaveCSS(
    "animation-name",
    "none",
  );
  await expect(page.locator(".star-twinkle-three")).toHaveCSS(
    "animation-name",
    "none",
  );
  const orbitBodies = [
    [".satellite-one animateMotion", "72s", "-5.76s"],
    [".satellite-two animateMotion", "103s", "-44.29s"],
    [".satellite-three animateMotion", "137s", "-104.12s"],
  ] as const;
  for (const [selector, duration, delay] of orbitBodies) {
    const motion = page.locator(selector);
    await expect(motion).toHaveAttribute("dur", duration);
    await expect(motion).toHaveAttribute("begin", delay);
  }
  await expect(page.locator(".orbiting-body")).toHaveCount(3);
  await expect(page.locator(".orbit-line")).toHaveCount(3);
  for (const selector of [
    ".satellite-one",
    ".satellite-two",
    ".satellite-three",
  ]) {
    const appearance = await page.locator(selector).evaluate((satellite) => {
      const fill = getComputedStyle(satellite).fill;
      const channels = fill.match(/[\d.]+/g)?.map(Number) ?? [];
      const filter = getComputedStyle(satellite).filter;
      return { channels, filter };
    });
    expect(appearance.channels).toHaveLength(3);
    expect(Math.min(...appearance.channels)).toBeGreaterThan(220);
    expect(appearance.filter.match(/drop-shadow/g)).toHaveLength(2);
  }
  expect(
    await page
      .locator(".celestial-orbits")
      .evaluate((svg) => (svg as SVGSVGElement).animationsPaused()),
  ).toBe(false);
  await expect(page.locator(".deep-space-backdrop")).toHaveCount(1);
  const nebula = page.locator(".deep-space-nebula-baked");
  await expect(nebula).toHaveAttribute("aria-hidden", "true");
  await expect(nebula).toHaveCSS("mix-blend-mode", "normal");
  await expect(nebula).toHaveCSS("background-image", /hero-nebula\.webp/);
  await expect(nebula).toHaveCSS(
    "animation-name",
    mobilePerformanceMode ? "none" : "nebula-baked-drift",
  );
  await expect(nebula).toHaveCSS("filter", "none");
  const nebulaResponse = await page.request.get("/space/hero-nebula.webp");
  expect(nebulaResponse.ok()).toBe(true);
  expect(nebulaResponse.headers()["content-type"]).toContain("image/webp");
  expect(await page.locator(".deep-space-nebula").count()).toBe(0);
  await expect(page.locator(".stardust-near")).toHaveCSS(
    "animation-name",
    "none",
  );
  await expect(page.locator(".aurora-wave")).toHaveCSS(
    "animation-name",
    "none",
  );
  await expect(page.locator(".aurora-curtains")).toHaveCSS(
    "animation-name",
    "none",
  );
  await expect(page.locator(".aurora-curtains")).toHaveCSS("filter", "none");
  await expect(page.locator(".celestial-scene")).toHaveAttribute(
    "data-cycle-duration",
    "120000",
  );
  await expect(page.locator(".celestial-scene")).toHaveAttribute(
    "data-initial-phase",
    "0.125",
  );
  await expect(page.locator(".aurora-wave")).toHaveCSS(
    "animation-duration",
    "0s",
  );
  await expect(page.locator(".stardust-mid")).toHaveCSS(
    "animation-duration",
    mobilePerformanceMode ? "0s" : "112s",
  );
  expect(
    await page.locator(".hero").evaluate((hero) => {
      return getComputedStyle(hero, "::after").animationName;
    }),
  ).toBe(mobilePerformanceMode ? "none" : "hero-ambient-drift");
  expect(
    await page.locator(".hero").evaluate((hero) => {
      return getComputedStyle(hero, "::after").animationDuration;
    }),
  ).toBe(mobilePerformanceMode ? "0s" : "72s");
});

test("mobile low-cost rendering keeps the nebula and essential motion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  expect(
    await page.evaluate(
      () => matchMedia("(max-width: 48rem), (pointer: coarse)").matches,
    ),
  ).toBe(true);

  await expect(page.locator(".header-bar")).toHaveCSS(
    "backdrop-filter",
    "none",
  );
  await expect(page.locator(".header-bar")).toHaveCSS(
    "background-color",
    "rgba(5, 6, 10, 0.94)",
  );
  await expect(page.locator(".transmission-panel").first()).toHaveCSS(
    "backdrop-filter",
    "none",
  );
  await expect(page.locator(".transmission-panel").first()).toHaveCSS(
    "background-color",
    "rgba(7, 8, 13, 0.94)",
  );

  await expect(page.locator(".deep-space-nebula-baked")).toBeVisible();
  await expect(page.locator(".deep-space-nebula-baked")).toHaveCSS(
    "background-image",
    /hero-nebula\.webp/,
  );
  await expect(page.locator(".deep-space-nebula-baked")).toHaveCSS(
    "filter",
    "none",
  );
  await expect(page.locator(".aurora-wave")).toHaveCSS("filter", "none");
  await expect(page.locator(".hero-space-background")).not.toHaveCSS(
    "mask-image",
    "none",
  );

  const journey = page.locator(".celestial-journey-atmosphere");
  await expect(page.locator(".journey-horizon")).toBeHidden();
  const journeyEffects = await journey.evaluate((element) => {
    const nebula = getComputedStyle(element, "::before");
    const highlight = getComputedStyle(element, "::after");
    const stars = getComputedStyle(
      element.querySelector(".journey-starfield")!,
    );
    return {
      nebulaTransform: nebula.transform,
      nebulaTransitionProperty: nebula.transitionProperty,
      nebulaTransitionDuration: nebula.transitionDuration,
      highlightDisplay: highlight.display,
      starsTransform: stars.transform,
      starsTransitionProperty: stars.transitionProperty,
    };
  });
  expect(journeyEffects).toEqual({
    nebulaTransform: "none",
    nebulaTransitionProperty: "opacity",
    nebulaTransitionDuration: "0.8s",
    highlightDisplay: "none",
    starsTransform: "none",
    starsTransitionProperty: "opacity",
  });

  for (const selector of [
    ".celestial-stage",
    ".deep-space-nebula-baked",
    ".aurora-curtains",
    ".aurora-wave",
    ".stardust-layer",
    ".star-twinkle",
  ]) {
    const elements = await page.locator(selector).all();
    expect(elements.length).toBeGreaterThan(0);
    for (const element of elements) {
      await expect(element).toHaveCSS("animation-name", "none");
    }
  }
  expect(
    await page.locator(".hero").evaluate((element) => ({
      animation: getComputedStyle(element, "::after").animationName,
      filter: getComputedStyle(element, "::after").filter,
    })),
  ).toEqual({ animation: "none", filter: "none" });
  expect(
    await page
      .locator(".moon")
      .evaluate(
        (element) => getComputedStyle(element, "::after").animationName,
      ),
  ).toBe("none");
  expect(
    await page
      .locator(".transmission-panel")
      .first()
      .evaluate(
        (element) => getComputedStyle(element, "::after").animationName,
      ),
  ).toBe("none");
  await expect(page.locator(".transmission-light").first()).toHaveCSS(
    "animation-name",
    "none",
  );
  for (const selector of [
    ".header-bar",
    ".hero-space-background",
    ".celestial-stage",
    ".deep-space-nebula-baked",
    ".journey-starfield",
    ".transmission-panel",
  ]) {
    await expect(page.locator(selector).first()).toHaveCSS(
      "will-change",
      "auto",
    );
  }

  await expect(page.locator(".moon")).toHaveAttribute(
    "data-cycle-duration",
    "120000",
  );
  await expect(page.locator(".moon image")).toHaveAttribute(
    "href",
    /lunar-surface\.webp/,
  );
  await expect(page.locator(".orbiting-body")).toHaveCount(3);
  expect(
    await page
      .locator(".celestial-orbits")
      .evaluate((svg) => (svg as SVGSVGElement).animationsPaused()),
  ).toBe(false);
});

test("throttles phase updates and pauses hero motion offscreen or in hidden tabs", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = window.requestAnimationFrame.bind(window);
    let callbacks = 0;
    let phaseUpdates = 0;
    Object.defineProperty(window, "__heroMotionMetrics", {
      configurable: true,
      get: () => ({ callbacks, phaseUpdates }),
    });
    Object.defineProperty(window, "__resetHeroMotionMetrics", {
      configurable: true,
      value: () => {
        callbacks = 0;
        phaseUpdates = 0;
      },
    });
    window.requestAnimationFrame = (callback) =>
      original((timestamp) => {
        callbacks++;
        callback(timestamp);
      });
    window.addEventListener("load", () => {
      const shadow = document.querySelector(".planet-shadow-morph path");
      if (shadow) {
        new MutationObserver((mutations) => {
          phaseUpdates += mutations.length;
        }).observe(shadow, { attributes: true, attributeFilter: ["d"] });
      }
    });
  });
  await page.goto("/");
  const hero = page.locator(".hero");
  const orbits = page.locator(".celestial-orbits");
  await expect(hero).toHaveAttribute("data-motion-active", "true");
  await page.evaluate(() => {
    (
      window as unknown as Window & { __resetHeroMotionMetrics: () => void }
    ).__resetHeroMotionMetrics();
  });
  const rate = await page.evaluate(async () => {
    const start = performance.now();
    await new Promise((resolve) => window.setTimeout(resolve, 2_000));
    const duration = performance.now() - start;
    const metrics = (
      window as unknown as Window & {
        __heroMotionMetrics: { phaseUpdates: number };
      }
    ).__heroMotionMetrics;
    return metrics.phaseUpdates / (duration / 1000);
  });
  const mobilePerformanceMode = await page.evaluate(
    () => matchMedia("(max-width: 48rem), (pointer: coarse)").matches,
  );
  expect(rate).toBeLessThanOrEqual(mobilePerformanceMode ? 6 : 15);
  await page.evaluate(() => {
    const about = document.querySelector<HTMLElement>("#about");
    if (about)
      window.scrollTo({ top: about.offsetTop + 100, behavior: "instant" });
  });
  await expect(hero).toHaveAttribute("data-motion-active", "false");
  await expect
    .poll(() =>
      orbits.evaluate((svg) => (svg as SVGSVGElement).animationsPaused()),
    )
    .toBe(true);
  const phaseAtPause = await page
    .locator(".moon")
    .getAttribute("data-cycle-position");
  await expect(page.locator(".stardust-mid")).toHaveCSS(
    "animation-play-state",
    "paused",
  );
  await expect(page.locator(".deep-space-nebula-baked")).toHaveCSS(
    "animation-play-state",
    "paused",
  );
  const pausedHeroAnimations = await page.evaluate(() => {
    const hero = document.querySelector(".hero");
    const selectors = [
      ".deep-space-nebula-baked",
      ".aurora-curtains",
      ".aurora-wave",
      ".stardust-layer",
      ".star-twinkle",
      ".celestial-stage",
    ];
    return [
      ...(hero ? [getComputedStyle(hero, "::after").animationPlayState] : []),
      ...selectors.map((selector) => {
        const element = document.querySelector(selector);
        return element
          ? getComputedStyle(element).animationPlayState
          : "missing";
      }),
      getComputedStyle(document.querySelector(".moon")!, "::after")
        .animationPlayState,
    ];
  });
  expect(pausedHeroAnimations).toEqual(Array(8).fill("paused"));
  await page.evaluate(() => {
    (
      window as unknown as Window & { __resetHeroMotionMetrics: () => void }
    ).__resetHeroMotionMetrics();
  });
  await page.waitForTimeout(500);
  const offscreenMetrics = await page.evaluate(
    () =>
      (
        window as unknown as Window & {
          __heroMotionMetrics: { callbacks: number; phaseUpdates: number };
        }
      ).__heroMotionMetrics,
  );
  expect(offscreenMetrics).toEqual({ callbacks: 0, phaseUpdates: 0 });
  const phaseWhileOffscreen = await page
    .locator(".moon")
    .getAttribute("data-cycle-position");
  expect(phaseWhileOffscreen).toBe(phaseAtPause);

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect(hero).toHaveAttribute("data-motion-active", "true");
  await expect
    .poll(() =>
      orbits.evaluate((svg) => (svg as SVGSVGElement).animationsPaused()),
    )
    .toBe(false);
  const phaseAfterReturn = Number(
    await page.locator(".moon").getAttribute("data-cycle-position"),
  );
  const phaseAdvance = (phaseAfterReturn - Number(phaseAtPause) + 1) % 1;
  expect(phaseAdvance).toBeGreaterThan(0.001);
  await page.evaluate(() => {
    (
      window as unknown as Window & { __resetHeroMotionMetrics: () => void }
    ).__resetHeroMotionMetrics();
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(hero).toHaveAttribute("data-motion-active", "false");
  await expect
    .poll(() =>
      orbits.evaluate((svg) => (svg as SVGSVGElement).animationsPaused()),
    )
    .toBe(true);
  await page.waitForTimeout(500);
  const hiddenMetrics = await page.evaluate(
    () =>
      (
        window as unknown as Window & {
          __heroMotionMetrics: { callbacks: number; phaseUpdates: number };
        }
      ).__heroMotionMetrics,
  );
  expect(hiddenMetrics).toEqual({ callbacks: 0, phaseUpdates: 0 });
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(hero).toHaveAttribute("data-motion-active", "true");
  await expect
    .poll(() =>
      orbits.evaluate((svg) => (svg as SVGSVGElement).animationsPaused()),
    )
    .toBe(false);
});

test("morphs the terminator geometry without rotating the texture", async ({
  page,
}) => {
  await page.goto("/");

  const moon = page.locator(".moon");
  await expect(page.locator(".celestial-scene")).toHaveAttribute(
    "data-cycle-duration",
    "120000",
  );
  await expect(page.locator(".moon")).toHaveAttribute(
    "data-phase",
    "waxing-crescent",
  );
  await expect(page.locator(".planet-shadow-morph")).toHaveAttribute(
    "transform",
    "rotate(12 50 50)",
  );
  const shadow = page.locator(".planet-shadow-morph path");
  const initialPath = await shadow.getAttribute("d");
  await expect.poll(() => shadow.getAttribute("d")).not.toBe(initialPath);
  await expect(moon).toHaveAttribute("data-cycle-position", /^(?!0\.000)/);
  await expect(page.locator(".moon image")).not.toHaveAttribute(
    "transform",
    /.+/,
  );
});

test("contains the full-hero deep-space background with a faded mask", async ({
  page,
}) => {
  await page.goto("/");
  const nebula = page.locator(".deep-space-nebula-baked");
  await expect(nebula).toHaveAttribute("aria-hidden", "true");
  await expect(nebula).toHaveCSS("background-size", "cover");
  const asset = await page.request.get("/space/hero-nebula.webp");
  expect(asset.ok()).toBe(true);
  expect(asset.headers()["content-type"]).toContain("image/webp");

  for (const [width, height] of [
    [1920, 1080],
    [1440, 900],
    [390, 844],
    [375, 812],
  ] as const) {
    await page.setViewportSize({ width, height });
    const geometry = await page.evaluate(() => {
      const baked = document.querySelector<HTMLElement>(
        ".deep-space-nebula-baked",
      )!;
      const background = document.querySelector(".hero-space-background")!;
      const visual = document.querySelector(".hero-visual")!;
      const bakedBounds = baked.getBoundingClientRect();
      return {
        bakedRight: bakedBounds.right,
        backgroundRight: background.getBoundingClientRect().right,
        bakedOverflow: getComputedStyle(baked).overflow,
        backgroundOverflow: getComputedStyle(background).overflow,
        backgroundMask: getComputedStyle(background).maskImage,
        visualOverflow: getComputedStyle(visual).overflowX,
        pageWidth: document.documentElement.scrollWidth,
      };
    });

    expect(geometry.bakedRight).toBeLessThanOrEqual(
      geometry.backgroundRight + 0.5,
    );
    expect(geometry.bakedOverflow).toBe("hidden");
    expect(geometry.backgroundOverflow).toBe("hidden");
    expect(geometry.backgroundMask).toContain("radial-gradient");
    expect(geometry.visualOverflow).toBe("visible");
    expect(geometry.pageWidth).toBe(width);
  }
});

test("satellites move along their distinct rendered ellipse paths", async ({
  page,
}) => {
  await page.goto("/");
  const orbits = [
    [".satellite-one", "orbit-one-path"],
    [".satellite-two", "orbit-two-path"],
    [".satellite-three", "orbit-three-path"],
  ] as const;
  for (const [selector, pathId] of orbits) {
    const pathCheck = await page
      .locator(selector)
      .evaluate((circle, expectedPathId) => {
        const satellite = circle as SVGCircleElement;
        const svg = satellite.ownerSVGElement;
        const group = satellite.parentElement as SVGGElement | null;
        const animation = circle.querySelector("animateMotion");
        const mpath = animation?.querySelector("mpath");
        const path = svg?.querySelector<SVGPathElement>(`#${expectedPathId}`);
        if (!svg || !group || !animation || !mpath || !path) return null;
        if (mpath.getAttribute("href") !== `#${expectedPathId}`) return null;

        const durationSeconds = Number.parseFloat(
          animation.getAttribute("dur") ?? "0",
        );
        const beginSeconds = Number.parseFloat(
          animation.getAttribute("begin") ?? "0",
        );
        const sample = (timeSeconds: number) => {
          svg.pauseAnimations();
          svg.setCurrentTime(timeSeconds);
          const progress =
            ((((timeSeconds - beginSeconds) % durationSeconds) +
              durationSeconds) %
              durationSeconds) /
            durationSeconds;
          const point = path.getPointAtLength(path.getTotalLength() * progress);
          const groupMatrix = group.getScreenCTM();
          const circleMatrix = satellite.getScreenCTM();
          if (!groupMatrix || !circleMatrix) return null;
          const expected = new DOMPoint(point.x, point.y).matrixTransform(
            groupMatrix,
          );
          const actual = new DOMPoint(0, 0).matrixTransform(circleMatrix);
          return { expected, actual };
        };

        const first = sample(10.25);
        const second = sample(15.25);
        if (!first || !second) return null;
        return {
          pathError: Math.hypot(
            first.actual.x - first.expected.x,
            first.actual.y - first.expected.y,
          ),
          travelDistance: Math.hypot(
            first.actual.x - second.actual.x,
            first.actual.y - second.actual.y,
          ),
        };
      }, pathId);
    expect(pathCheck).not.toBeNull();
    expect(pathCheck!.pathError).toBeLessThan(1);
    expect(pathCheck!.travelDistance).toBeGreaterThan(10);
  }
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
  for (const width of [320, 360, 375, 390, 430, 768, 1024, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      `expected no horizontal overflow at ${width}px`,
    ).toBe(true);
  }
  await expect(
    page.getByRole("link", { name: "参加方法を見る" }),
  ).toBeVisible();
});

test("keeps the planetary scene framed on target desktop and mobile sizes", async ({
  page,
}) => {
  await page.goto("/");

  for (const [width, height] of [
    [1920, 1080],
    [1440, 900],
    [1366, 768],
    [390, 844],
    [375, 812],
    [360, 800],
    [320, 700],
  ] as const) {
    await page.setViewportSize({ width, height });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      `expected no horizontal overflow at ${width}x${height}`,
    ).toBe(true);
    await expect(
      page.getByRole("link", { name: "参加方法を見る" }),
    ).toBeVisible();

    await expect(page.locator(".hero-space-background")).toBeAttached();
    const backgroundTreatment = await page
      .locator(".hero-space-background")
      .evaluate((background) => ({
        mask: getComputedStyle(background).maskImage,
        visualOverflow: getComputedStyle(
          document.querySelector(".hero-visual")!,
        ).overflow,
      }));
    expect(backgroundTreatment.mask).toContain("radial-gradient");
    expect(backgroundTreatment.visualOverflow).toBe("visible");

    const framing = await page.locator(".moon").evaluate((moon) => {
      const circle = moon.getBoundingClientRect();
      const scene = moon.closest(".hero-visual")?.getBoundingClientRect();
      return {
        circleWidth: circle.width,
        withinScene:
          scene !== undefined &&
          circle.left >= scene.left &&
          circle.right <= scene.right,
      };
    });
    expect(framing.circleWidth).toBeGreaterThan(48);
    expect(framing.withinScene).toBe(true);
  }
});

test("respects reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.locator("#about").scrollIntoViewIfNeeded();
  await expect(page.locator(".orbital-active-satellite")).toHaveCSS(
    "transition-duration",
    "0s",
  );
  await expect(page.locator(".celestial-journey-atmosphere")).toHaveCSS(
    "transition-duration",
    "0s",
  );
  await expect(page.locator(".transmission-light").first()).toHaveCSS(
    "animation-name",
    "none",
  );
  expect(
    await page
      .locator(".transmission-panel")
      .first()
      .evaluate((panel) => getComputedStyle(panel, "::after").animationName),
  ).toBe("none");
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    ),
  ).toBe("auto");
  for (const selector of [
    ".moon",
    ".aurora-curtains",
    ".aurora-wave",
    ".deep-space-nebula-baked",
    ".star-twinkle-one",
    ".stardust-far",
    ".stardust-mid",
    ".stardust-near",
  ]) {
    await expect(page.locator(selector)).toHaveCSS("animation-name", "none");
  }
  expect(
    await page
      .locator(".celestial-orbits")
      .evaluate((svg) => (svg as SVGSVGElement).animationsPaused()),
  ).toBe(true);
  expect(
    await page.locator(".hero").evaluate((hero) => {
      return getComputedStyle(hero, "::after").animationName;
    }),
  ).toBe("none");
  await expect(page.locator(".moon-svg")).toBeVisible();
  await expect(page.locator(".moon")).toHaveAttribute(
    "data-phase",
    "waxing-crescent",
  );
  await expect(page.locator(".moon")).toHaveAttribute(
    "data-cycle-position",
    "0.125",
  );
  await expect(page.locator(".planet-shadow-morph")).toHaveAttribute(
    "transform",
    "rotate(12 50 50)",
  );
  await expect(page.locator(".hero-logo")).toBeVisible();
});
