import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

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

test("constellation navigation links, focuses destinations, and tracks the active section", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const constellation = page.getByRole("navigation", {
    name: "Celenas セクションナビゲーション",
  });
  await expect(constellation).toBeVisible();
  const links = constellation.getByRole("link");
  await expect(links).toHaveCount(6);
  const expectedHrefs = [
    "#about",
    "#world",
    "#community",
    "#rules",
    "#gallery",
    "#join",
  ];
  for (const [index, href] of expectedHrefs.entries()) {
    await expect(links.nth(index)).toHaveAttribute("href", href);
  }

  const world = constellation.getByRole("link", { name: /02 World/ });
  await world.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#world$/);
  await expect(page.locator("#world")).toBeFocused();
  await expect(page.locator("#world")).toBeInViewport();
  await expect(world).toHaveAttribute("aria-current", "location");

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await page.goForward();
  await expect(page).toHaveURL(/#world$/);
  await expect(page.locator("#world")).toBeFocused();

  const gallery = constellation.getByRole("link", { name: /05 Gallery/ });
  await gallery.focus();
  await page.keyboard.press("Space");
  await expect(page).toHaveURL(/#gallery$/);
  await expect(page.locator("#gallery")).toBeFocused();
});

test("constellation supports direct hash navigation and stays hidden on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#gallery");
  await expect(page.locator("#gallery")).toBeInViewport();
  await expect(
    page
      .getByRole("navigation", { name: "Celenas セクションナビゲーション" })
      .getByRole("link", { name: /05 Gallery/ }),
  ).toHaveAttribute("aria-current", "location");

  await page.setViewportSize({ width: 375, height: 812 });
  await expect(
    page.getByRole("navigation", { name: "Celenas セクションナビゲーション" }),
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

test("keeps constellation visible on tablet and hides it on narrow mobile", async ({
  page,
}) => {
  await page.goto("/");
  const constellation = page.getByRole("navigation", {
    name: "Celenas セクションナビゲーション",
  });
  for (const width of [1024, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(constellation).toBeVisible();
    expect(
      await constellation
        .getByRole("link", { name: /06 Join/ })
        .evaluate((node) => {
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
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(constellation).toBeHidden();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
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
  const proceduralNebula = page.locator(".deep-space-nebula");
  await expect(proceduralNebula).toHaveAttribute("aria-hidden", "true");
  await expect(proceduralNebula.locator("feTurbulence")).toHaveCount(2);
  await expect(page.locator(".nebula-far-cloud")).toHaveCount(1);
  await expect(page.locator(".nebula-main-cloud")).toHaveCount(1);
  await expect(page.locator(".nebula-dust-lanes path")).toHaveCount(2);
  await expect(page.locator(".nebula-near-gas")).toHaveCount(1);
  for (const [selector, animationName] of [
    [".nebula-far-cloud", "nebula-far-drift"],
    [".nebula-main-cloud", "nebula-main-drift"],
    [".nebula-near-gas", "nebula-near-drift"],
    [".aurora-wave", "aurora-flow"],
    [".aurora-curtains", "aurora-color-shift"],
  ] as const) {
    const layer = page.locator(selector);
    await expect(layer).toHaveCSS("animation-name", animationName);
    expect(
      await layer.evaluate((element) => {
        const animation = element.getAnimations()[0];
        const duration = animation?.effect?.getTiming().duration;
        if (!animation || typeof duration !== "number") return false;
        animation.pause();
        animation.currentTime = 0;
        const start = [
          getComputedStyle(element).transform,
          getComputedStyle(element).opacity,
          getComputedStyle(element).filter,
        ].join("|");
        animation.currentTime = duration / 2;
        const middle = [
          getComputedStyle(element).transform,
          getComputedStyle(element).opacity,
          getComputedStyle(element).filter,
        ].join("|");
        animation.play();
        return start !== middle;
      }),
    ).toBe(true);
  }
  await expect(page.locator(".celestial-scene")).toHaveAttribute(
    "data-cycle-duration",
    "120000",
  );
  await expect(page.locator(".celestial-scene")).toHaveAttribute(
    "data-initial-phase",
    "0.125",
  );
  await expect(page.locator(".aurora-curtains")).toHaveCSS(
    "animation-duration",
    "96s",
  );
  await expect(page.locator(".aurora-wave")).toHaveCSS(
    "animation-duration",
    "74s",
  );
  await expect(page.locator(".nebula-far-cloud")).toHaveCSS(
    "animation-duration",
    "148s",
  );
  await expect(page.locator(".nebula-main-cloud")).toHaveCSS(
    "animation-duration",
    "96s",
  );
  await expect(page.locator(".nebula-near-gas")).toHaveCSS(
    "animation-duration",
    "62s",
  );
  for (const [selector, duration] of [
    [".stardust-far", "150s"],
    [".stardust-mid", "112s"],
    [".stardust-near", "60s"],
  ] as const) {
    await expect(page.locator(selector)).toHaveCSS(
      "animation-duration",
      duration,
    );
  }
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
  const constellationPoint = page.locator(".constellation-point").first();
  await expect(constellationPoint).toHaveCSS("animation-name", "none");
  await expect(page.locator(".constellation-lines line").first()).toHaveCSS(
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
    ".nebula-far-cloud",
    ".nebula-main-cloud",
    ".nebula-dust-lanes",
    ".nebula-near-gas",
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
