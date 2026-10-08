import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

const discordInviteUrl = "https://discord.gg/cuXPVNccYv";

async function expectViewerImageReady(image: Locator) {
  await expect(image).toBeVisible();
  await expect
    .poll(() =>
      image.evaluate((node) => {
        const element = node as HTMLImageElement;
        const rect = element.getBoundingClientRect();

        return (
          element.complete &&
          element.naturalWidth > 0 &&
          element.naturalHeight > 0 &&
          rect.width > 0 &&
          rect.height > 0
        );
      }),
    )
    .toBe(true);
}

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
  await expect
    .poll(() =>
      page.locator(".orbital-fixed-node").evaluateAll((nodes) => {
        const styles = nodes.map((node) => {
          const style = getComputedStyle(node);
          return [
            style.width,
            style.height,
            style.borderWidth,
            style.borderStyle,
            style.borderColor,
            style.borderRadius,
            style.backgroundColor,
            style.boxShadow,
            style.opacity,
            style.transform,
          ].join("|");
        });
        return new Set(styles).size === 1;
      }),
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

test("home exposes the current edition and Discord action with no runtime errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const response = await page.goto("/");

  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle("Celenas SMP | Minecraftサバイバルサーバー");
  await expect(
    page.getByRole("heading", { level: 1, name: "Celenas SMP" }),
  ).toBeVisible();
  await expect(
    page.getByText("MINECRAFT JAVA 26.3 / SURVIVAL SMP"),
  ).toBeVisible();
  await expect(page.getByText("好きなことを、好きなペースで。")).toBeVisible();
  await expect(page.locator(".hero-supporting")).toHaveText(
    "建築、探索、装置づくり。ひとりで黙々と遊ぶのも、みんなで何かを作るのも自由です。",
  );
  await expect(page.locator(".hero-note")).toHaveText(
    "Minecraft Java Edition 26.3",
  );
  await expect(
    page.getByRole("link", { name: "Discordに参加する" }),
  ).toHaveAttribute("href", discordInviteUrl);
  expect(errors).toEqual([]);
});

test("publishes canonical SEO metadata and a single-page sitemap", async ({
  page,
}) => {
  await page.goto("/");

  const canonicalUrl = "https://chise7-mc.github.io/Celenas-SMP-web/";
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    "Celenas SMPは、Minecraft Java Edition 26.3で建築・探索・装置づくりを楽しめるサバイバルサーバーです。参加申請はDiscordから受け付けています。",
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    canonicalUrl,
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "index, follow",
  );

  const sitemapResponse = await page.request.get("/sitemap.xml");
  expect(sitemapResponse.status()).toBe(200);
  expect(sitemapResponse.headers()["content-type"]).toContain("xml");
  const sitemap = await sitemapResponse.text();
  expect(sitemap).toContain(
    "<loc>https://chise7-mc.github.io/Celenas-SMP-web/</loc>",
  );
  expect(sitemap.match(/<loc>/g)).toHaveLength(1);
  expect(sitemap).not.toContain("#about");
});

test("publishes the configured Open Graph and large Twitter image metadata", async ({
  page,
}) => {
  await page.goto("/");

  const imageUrl =
    "https://chise7-mc.github.io/Celenas-SMP-web/og/celenas-og.png";
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    "Celenas SMP",
  );
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
    "content",
    "Minecraftサバイバルコミュニティ",
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    "https://chise7-mc.github.io/Celenas-SMP-web/",
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    imageUrl,
  );
  await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute(
    "content",
    "Celenas SMP OG image",
  );
  await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute(
    "content",
    "1200",
  );
  await expect(
    page.locator('meta[property="og:image:height"]'),
  ).toHaveAttribute("content", "630");
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image",
  );
  await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute(
    "content",
    "Celenas SMP",
  );
  await expect(
    page.locator('meta[name="twitter:description"]'),
  ).toHaveAttribute("content", "Minecraftサバイバルコミュニティ");
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
    "content",
    imageUrl,
  );
  await expect(page.locator('meta[name="twitter:image:alt"]')).toHaveAttribute(
    "content",
    "Celenas SMP OG image",
  );

  const imageResponse = await page.request.get("/og/celenas-og.png");
  expect(imageResponse.status()).toBe(200);
  expect(imageResponse.headers()["content-type"]).toContain("image/png");
});

test("publishes edition and Discord information without a server address", async ({
  page,
}, testInfo) => {
  const isMobile = testInfo.project.name === "mobile-chromium";
  await page.setViewportSize({
    width: isMobile ? 390 : 1440,
    height: isMobile ? 844 : 900,
  });
  await page.goto("/");

  const links = [
    page.getByRole("link", { name: "Discordに参加する" }),
    page.getByRole("link", { name: "Discord コミュニティへ参加 ↗" }),
    page.getByRole("link", { name: "Discordで参加申請" }),
  ];
  for (const link of links) {
    await expect(link).toBeVisible();
    await expect(link).toBeEnabled();
    await expect(link).toHaveAttribute("href", discordInviteUrl);
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noreferrer");
  }

  await expect(page.locator(".community-details dt")).toHaveText([
    "エディション",
    "バージョン",
    "参加窓口",
  ]);
  await expect(page.locator(".community-details")).toContainText(
    "Minecraft Java Edition",
  );
  await expect(page.locator(".community-details")).toContainText("26.3");
  await expect(page.locator(".community-details")).not.toContainText(
    "サーバーアドレス",
  );
  await expect(page.locator(".community-note")).toContainText(
    "申請後の接続手順はDiscordで案内しています。サーバーアドレスはWebでは公開していません。",
  );
  await expect(page.locator(".transmission-panel-community")).toHaveAttribute(
    "data-state",
    "info",
  );
  await expect(page.locator(".transmission-panel-community")).toContainText(
    "PUBLIC INFO / COMMUNITY",
  );
  await expect(page.locator(".transmission-panel-join")).toHaveAttribute(
    "data-state",
    "info",
  );
  await expect(page.locator(".transmission-panel-join")).toContainText(
    "参加申請と承認後の接続案内はDiscordで確認できます。",
  );
  const discordLogo = page.locator("#join .discord-mark");
  await expect(discordLogo).toBeVisible();
  await expect(discordLogo).toHaveAttribute("alt", "");
  await expect(discordLogo).toHaveAttribute("src", /discord-mark\.png/);
  const discordLogoWidth = await discordLogo.evaluate(
    (image) => image.getBoundingClientRect().width,
  );
  expect(discordLogoWidth).toBeGreaterThanOrEqual(36);
  expect(discordLogoWidth).toBeLessThanOrEqual(44);
  await expect(
    page.locator(".transmission-panel-join .glass-button-primary img"),
  ).toHaveCount(0);
  const discordLogoResponse = await page.request.get(
    new URL("/brand/discord-mark.png", page.url()).toString(),
  );
  expect(discordLogoResponse.status()).toBe(200);
  expect(discordLogoResponse.headers()["content-type"]).toContain("image/png");
  const joinDiscordLink = page.getByRole("link", {
    name: "Discordで参加申請",
  });
  await expect(joinDiscordLink).toHaveAttribute("href", discordInviteUrl);
  await expect(joinDiscordLink).toHaveAttribute("target", "_blank");
  await expect(joinDiscordLink).toHaveAttribute("rel", "noreferrer");
  await expect(
    page.locator(".transmission-panel-join .glass-button-primary"),
  ).toHaveAttribute("target", "_blank");
  await expect(
    page.locator(".transmission-panel-join .glass-button-primary"),
  ).toHaveAttribute("rel", "noreferrer");
  const transmissionTreatment = await page
    .locator(".transmission-panel-community")
    .evaluate((panel) => {
      const grid = getComputedStyle(panel).backgroundImage;
      const scan = getComputedStyle(panel, "::after").backgroundImage;
      return {
        gridOpacity: Number(grid.match(/rgba\(255, 255, 255, ([\d.]+)\)/)?.[1]),
        scanOpacity: Number(scan.match(/rgba\(167, 181, 255, ([\d.]+)\)/)?.[1]),
        scanAnimation: getComputedStyle(panel, "::after").animationName,
      };
    });
  expect(transmissionTreatment.gridOpacity).toBeCloseTo(0.026, 2);
  expect(transmissionTreatment.scanOpacity).toBeCloseTo(0.075, 2);
  if (isMobile) {
    expect(transmissionTreatment.scanAnimation).toBe("none");
  } else {
    expect(transmissionTreatment.scanAnimation).toBe("transmission-scan");
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
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

test("renders refreshed copy, six formal rules, and image-only gallery cards", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator('img[src*="celenas-logo-white.png"]')).toHaveCount(
    3,
  );
  await expect(
    page.getByRole("heading", {
      name: "気軽に遊べて、長く続けられるSMP。",
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Minecraft Java 26.3 · Survival SMP"),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "建築も、探索も、装置も。" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "参加・連絡はDiscordから。" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Celenas SMPに参加する" }),
  ).toBeVisible();
  await expect(page.locator(".join-steps li")).toHaveCount(3);
  await expect(page.locator(".join-steps h3")).toHaveText([
    "Discordに参加する",
    "Minecraft IDで参加申請",
    "運営の承認後に接続",
  ]);
  await expect(page.locator(".hero-description")).toHaveCSS(
    "line-break",
    "strict",
  );
  await expect(page.locator(".hero-description")).toHaveCSS(
    "word-break",
    "normal",
  );
  await expect(page.locator("#rules .section-heading h2")).toHaveCSS(
    "text-wrap",
    "balance",
  );
  await expect(page.locator("#about .section-description")).toHaveText(
    "Celenas SMPは、自分のペースを大切にしながら遊べるコミュニティです。",
  );
  await expect(page.locator(".value-list li")).toHaveText([
    "01無理せず、自分のペースで",
    "02人の建築や持ち物を大切に",
    "03ひとりでも、みんなでも",
  ]);
  await expect(page.locator("#world .section-description")).toHaveText(
    "建築・探索・装置づくり。それぞれの楽しみ方を、ワールドの中で形にできます。",
  );
  await expect(page.locator("#community .section-description")).toHaveText(
    "Discordを参加の窓口として、お知らせや質問・相談、プレイヤー同士の情報共有を行っています。参加申請もこちらからどうぞ。",
  );
  await expect(page.locator(".join-copy .muted")).toHaveText(
    "Discordで申請し、承認後にMinecraftから参加できます。",
  );
  await expect(page.locator(".rules-list > li")).toHaveCount(6);
  await expect(
    page.getByRole("heading", { name: "みんなで遊ぶためのルール。" }),
  ).toBeVisible();
  await expect(page.locator("#rules .section-description")).toHaveText(
    "難しい決まりはありません。人の建築やアイテムを大切にして、困ったときは運営へ相談してください。",
  );
  await expect(page.locator(".rule-number")).toHaveText([
    "01",
    "02",
    "03",
    "04",
    "05",
    "06",
  ]);
  await expect(page.locator(".rules-list h3")).toHaveText([
    "他の人のものを大切に",
    "荒らし・嫌がらせは禁止",
    "不正なプレイをしない",
    "PvPは相手の同意を",
    "大規模な装置は周囲に配慮",
    "困ったときは運営へ",
  ]);
  await expect(page.locator(".rules-list li p")).toHaveText([
    "他のプレイヤーの建築・装置・アイテムを、許可なく壊したり持ち出したりしないでください。",
    "意図的な破壊、妨害、迷惑行為、過度な煽りや嫌がらせなど、他の人が遊びにくくなる行為は禁止です。",
    "チート、不正クライアント、運営が認めていない意図的なバグ悪用など、公平性を大きく損なう行為は禁止です。",
    "通常時のPvPや他プレイヤーへの攻撃は、お互いが了承している場合に行ってください。イベント時はそのイベントのルールを優先します。",
    "大規模装置やサーバー負荷の高い設備をつくる場合は、周囲への影響を確認し、必要に応じて運営へ相談してください。",
    "トラブルや判断に迷うことがあれば、当事者同士で無理に解決せずDiscordから運営へ相談してください。",
  ]);
  await expect(page.locator(".rules-footnote")).toContainText(
    "重要な変更はDiscordでお知らせします。",
  );
  await expect(
    page.getByRole("heading", { name: "ワールドの様子。" }),
  ).toBeVisible();
  await expect(page.locator("#gallery .section-description")).toHaveText(
    "建築、装置、風景など、ワールドで撮った写真を載せています。",
  );
  await expect(page.locator("#gallery .section-heading h2")).toHaveCSS(
    "line-break",
    "strict",
  );
  const galleryCards = page.locator("#gallery .gallery-slide");
  await expect(galleryCards).toHaveCount(5);
  expect(
    await page
      .locator("#gallery .gallery-slide img")
      .evaluateAll((images) =>
        images.map((image) => image.getAttribute("alt")),
      ),
  ).toEqual([
    "広い掘削地に並ぶ装置群とビーコンの光",
    "石造りの建物が並ぶ街の広場",
    "星空の下にそびえる光る巨大建築",
    "海上の小島に建つ塔のある建築",
    "エンドに建設されたブラックホール型のサンドデューパー",
  ]);
  const galleryImage = page.locator(
    '#gallery .gallery-slide img[alt="エンドに建設されたブラックホール型のサンドデューパー"]',
  );
  await expect(galleryImage).toHaveAttribute(
    "alt",
    "エンドに建設されたブラックホール型のサンドデューパー",
  );
  await galleryImage.scrollIntoViewIfNeeded();
  await expect(galleryImage).toBeVisible();
  await expect(page.locator("#gallery figcaption")).toHaveCount(0);
  await expect(page.getByText("black_hole", { exact: true })).toHaveCount(0);
  await expect(page.getByText("end", { exact: true })).toHaveCount(0);
  await expect
    .poll(() =>
      galleryImage.evaluate(
        (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
      ),
    )
    .toBe(true);
  const naturalSize = await galleryImage.evaluate(
    (image: HTMLImageElement) => ({
      width: image.naturalWidth,
      height: image.naturalHeight,
    }),
  );
  expect(naturalSize.width / naturalSize.height).toBeCloseTo(1920 / 1009, 2);
  await expect(galleryImage).toHaveCSS("object-fit", "contain");
  expect(
    Number.parseFloat(
      await galleryImage.evaluate(
        (image) => getComputedStyle(image).borderTopLeftRadius,
      ),
    ),
  ).toBeGreaterThan(0);
  const imageFrame = await galleryImage.boundingBox();
  expect(imageFrame).not.toBeNull();
  expect(imageFrame!.width / imageFrame!.height).toBeCloseTo(1920 / 1009, 2);
  const stage = galleryImage.locator("xpath=ancestor::figure[1]");
  const stageBox = await stage.boundingBox();
  expect(stageBox).not.toBeNull();
  expect(
    await stage.evaluate((element) => getComputedStyle(element).borderWidth),
  ).toBe("0px");
  const stageImageCenterDelta = Math.abs(
    stageBox!.y +
      stageBox!.height / 2 -
      (imageFrame!.y + imageFrame!.height / 2),
  );
  expect(
    stageImageCenterDelta,
    JSON.stringify({ stageBox, imageFrame }),
  ).toBeLessThanOrEqual(1);
  await expect(page.locator(".join-copy")).toContainText(
    "Discordで申請し、承認後にMinecraftから参加できます。",
  );
  await expect(page.locator(".site-footer")).toContainText(
    "Celenas SMP · Minecraft Java 26.3",
  );
  await expect(page.locator(".about-copy p")).toHaveText([
    "人それぞれの建築や探索を尊重し、ひとりで過ごす時間も、誰かと一緒に遊ぶ時間も大切にしています。遊び方やログイン頻度を合わせる必要はありません。",
    "それぞれが作ったものや過ごした時間がワールドに積み重なっていく。そんな場所を、みんなで長く育てていきます。",
  ]);
  await expect(page.locator(".world-themes h3")).toHaveText([
    "BUILD / 建築",
    "EXPLORE / 探索",
    "CREATE / ものづくり",
  ]);
  await expect(page.locator(".world-themes p")).toHaveText([
    "拠点づくりから街づくり、巨大建築まで。規模もジャンルも自由です。",
    "新しい地形や資源を探したり、遠くまで旅したり。気になる場所へ自由に出かけられます。",
    "自動化装置や交通網、共有設備など。便利なものを作るのもCelenasの遊び方のひとつです。",
  ]);
  await expect(
    page.getByText(
      /接続情報は準備中|接続先は公開準備中|対応バージョンは確認中|正式なルールは準備中/,
    ),
  ).toHaveCount(0);
});

test("cinematic Gallery rail navigates with arrows and keyboard", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === "mobile-chromium");
  await page.goto("/");
  const track = page.getByRole("region", { name: "Celenas Gallery" });
  const counter = page.locator(".gallery-counter");
  const previous = page.getByRole("button", { name: "前の画像" });
  const next = page.getByRole("button", { name: "次の画像" });

  await expect(track.locator(".gallery-slide")).toHaveCount(5);
  await expect(counter).toHaveText("01 / 05");
  await expect(previous).toBeDisabled();
  await expect(next).toBeEnabled();
  const railMetrics = await track.evaluate((element) => {
    const style = getComputedStyle(element);
    const trackRect = element.getBoundingClientRect();
    const secondRect = element.children[1]?.getBoundingClientRect();
    return {
      scrollSnapType: style.scrollSnapType,
      overflowX: style.overflowX,
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      nextPeekRatio: secondRect
        ? Math.max(0, trackRect.right - secondRect.left) / secondRect.width
        : 0,
    };
  });
  expect(railMetrics.scrollSnapType).toContain("x mandatory");
  expect(railMetrics.overflowX).toBe("auto");
  expect(railMetrics.scrollWidth).toBeGreaterThan(railMetrics.clientWidth);
  expect(railMetrics.nextPeekRatio).toBeGreaterThan(0.12);
  expect(railMetrics.nextPeekRatio).toBeLessThan(0.4);

  const progress = page.getByRole("progressbar", { name: "Gallery progress" });
  await expect(progress).toHaveAttribute("aria-valuenow", "1");
  await next.click();
  await expect(counter).toHaveText("02 / 05");
  await expect(previous).toBeEnabled();
  await expect(progress).toHaveAttribute("aria-valuenow", "2");

  await track.focus();
  await page.keyboard.press("ArrowRight");
  await expect(counter).toHaveText("03 / 05");
  await page.keyboard.press("ArrowLeft");
  await expect(counter).toHaveText("02 / 05");

  for (const expected of ["03 / 05", "04 / 05", "05 / 05"]) {
    await next.click();
    await expect(counter).toHaveText(expected);
  }
  await expect(counter).toHaveText("05 / 05");
  await expect(next).toBeDisabled();
  await expect(progress).toHaveAttribute("aria-valuenow", "5");
  await previous.click();
  await expect(counter).toHaveText("04 / 05");
});

test("Gallery images open an accessible fullscreen viewer", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  const imageButton = page.getByRole("button", {
    name: "画像を拡大: 広い掘削地に並ぶ装置群とビーコンの光",
  });
  const viewer = page.getByRole("dialog", { name: "Gallery image viewer" });
  await expect(viewer.locator("img")).toHaveCount(0);
  await imageButton.click();

  await expect(viewer).toBeVisible();
  const viewerImage = viewer.locator(".gallery-viewer-image-content");
  await expectViewerImageReady(viewerImage);
  await expect(viewer).toHaveCSS("border-width", "0px");
  await expect(viewer).toHaveCSS("padding", "0px");
  await expect(viewer).toHaveCSS("margin", "0px");
  const viewerSurface = await viewer.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const styles = getComputedStyle(element);
    return {
      width: bounds.width,
      height: bounds.height,
      background: styles.backgroundColor,
      borderRadius: styles.borderRadius,
    };
  });
  expect(viewerSurface.width).toBe(page.viewportSize()!.width);
  expect(viewerSurface.height).toBe(page.viewportSize()!.height);
  const backgroundChannels = viewerSurface.background
    .match(/[\d.]+/g)!
    .map(Number);
  expect(backgroundChannels.slice(0, 3)).toEqual([3, 4, 7]);
  expect(backgroundChannels[3]).toBeCloseTo(0.985, 2);
  expect(viewerSurface.borderRadius).toBe("0px");
  const viewerSemanticImage = viewer.getByRole("img", {
    name: "広い掘削地に並ぶ装置群とビーコンの光",
  });
  await expect(viewerSemanticImage).toBeVisible();
  await expect(viewerSemanticImage).toHaveCSS("object-fit", "contain");
  expect(
    Number.parseFloat(
      await viewerSemanticImage.evaluate(
        (image) => getComputedStyle(image).borderTopLeftRadius,
      ),
    ),
  ).toBeGreaterThan(0);
  await expect(viewer.locator(".gallery-counter")).toHaveText("01 / 05");
  const desktopLayout = await viewer.evaluate((dialog) => {
    const image = dialog.querySelector("img")!.getBoundingClientRect();
    const previous = dialog
      .querySelector(".gallery-viewer-prev")!
      .getBoundingClientRect();
    const next = dialog
      .querySelector(".gallery-viewer-next")!
      .getBoundingClientRect();
    const close = dialog
      .querySelector(".gallery-viewer-close")!
      .getBoundingClientRect();
    const counter = dialog
      .querySelector(".gallery-viewer-counter")!
      .getBoundingClientRect();
    return {
      imageCenterX: image.left + image.width / 2,
      imageCenterY: image.top + image.height / 2,
      previousLeft: previous.left,
      nextRight: window.innerWidth - next.right,
      closeTop: close.top,
      closeRight: window.innerWidth - close.right,
      counterCenterX: counter.left + counter.width / 2,
      counterBottom: window.innerHeight - counter.bottom,
    };
  });
  expect(
    Math.abs(desktopLayout.imageCenterX - page.viewportSize()!.width / 2),
  ).toBeLessThanOrEqual(1);
  expect(
    Math.abs(desktopLayout.imageCenterY - page.viewportSize()!.height / 2),
  ).toBeLessThanOrEqual(1);
  if (page.viewportSize()!.width >= 768) {
    expect(desktopLayout.previousLeft).toBeLessThanOrEqual(50);
    expect(desktopLayout.nextRight).toBeLessThanOrEqual(50);
    expect(desktopLayout.closeTop).toBeLessThanOrEqual(25);
    expect(desktopLayout.closeRight).toBeLessThanOrEqual(25);
    expect(
      Math.abs(desktopLayout.counterCenterX - page.viewportSize()!.width / 2),
    ).toBeLessThanOrEqual(1);
    expect(desktopLayout.counterBottom).toBeLessThanOrEqual(30);
  }
  await expect(viewer.locator(".gallery-viewer-image-content")).toHaveCSS(
    "animation-name",
    "gallery-viewer-reveal",
  );
  await expect(viewer.locator(".gallery-viewer-image-content")).toHaveCSS(
    "animation-duration",
    "0.18s",
  );
  await viewer.locator(".gallery-viewer-counter").click();
  await expect(viewer).toBeVisible();
  const previous = viewer.getByRole("button", { name: "前の画像" });
  const next = viewer.getByRole("button", {
    name: "次の画像",
    exact: true,
  });
  await expect(previous).toBeDisabled();
  await viewer.getByRole("button", { name: "次の画像を表示" }).click();
  await expect(viewer.locator(".gallery-counter")).toHaveText("02 / 05");
  await expect(
    viewer.getByRole("img", { name: "石造りの建物が並ぶ街の広場" }),
  ).toBeVisible();
  await next.click();
  await expect(viewer.locator(".gallery-counter")).toHaveText("03 / 05");
  if (testInfo.project.name === "desktop-chromium") {
    await page.keyboard.press("ArrowRight");
    await expect(viewer.locator(".gallery-counter")).toHaveText("04 / 05");
    await page.keyboard.press("ArrowLeft");
    await expect(viewer.locator(".gallery-counter")).toHaveText("03 / 05");
  }
  await next.click();
  await next.click();
  await expect(viewer.locator(".gallery-counter")).toHaveText("05 / 05");
  await expect(next).toBeDisabled();
  await expect(
    viewer.getByRole("button", { name: "次の画像を表示" }),
  ).toBeDisabled();
  await expect(viewer.getByRole("button", { name: "前の画像" })).toBeEnabled();
  if (testInfo.project.name === "desktop-chromium") {
    await page.keyboard.press("ArrowRight");
    await expect(viewer.locator(".gallery-counter")).toHaveText("05 / 05");
    await page.keyboard.press("ArrowLeft");
  } else {
    await viewer.getByRole("button", { name: "前の画像" }).click();
  }
  await expect(viewer.locator(".gallery-counter")).toHaveText("04 / 05");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(viewer.locator(".gallery-viewer-image-content")).toHaveCSS(
    "animation-name",
    "none",
  );
  await page.keyboard.press("Escape");
  await expect(viewer).not.toBeVisible();
  await expect(imageButton).toBeFocused();

  await imageButton.click();
  await viewer.getByRole("button", { name: "画像ビューアーを閉じる" }).click();
  await expect(viewer).not.toBeVisible();
  await expect(imageButton).toBeFocused();

  await imageButton.click();
  await page.mouse.click(5, 200);
  await expect(viewer).not.toBeVisible();
  await expect(imageButton).toBeFocused();
});

test("fullscreen viewer stays aligned and edge controls stay clear on desktop", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === "mobile-chromium");
  const viewports = [
    { width: 1920, height: 1080 },
    { width: 1440, height: 900 },
    { width: 1366, height: 768 },
  ];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page
      .getByRole("button", { name: "画像を拡大: 石造りの建物が並ぶ街の広場" })
      .click();
    const viewer = page.getByRole("dialog", { name: "Gallery image viewer" });
    await expect(viewer).toBeVisible();
    await expectViewerImageReady(
      viewer.locator(".gallery-viewer-image-content"),
    );
    const layout = await viewer.evaluate((dialog) => {
      const image = dialog.querySelector("img")!.getBoundingClientRect();
      const previous = dialog
        .querySelector(".gallery-viewer-prev")!
        .getBoundingClientRect();
      const next = dialog
        .querySelector(".gallery-viewer-next")!
        .getBoundingClientRect();
      return {
        imageCenterX: image.left + image.width / 2,
        imageCenterY: image.top + image.height / 2,
        imageRatio: image.width / image.height,
        previousRight: previous.right,
        nextLeft: next.left,
        width: window.innerWidth,
        height: window.innerHeight,
        pageWidth: document.documentElement.scrollWidth,
      };
    });
    expect(
      Math.abs(layout.imageCenterX - viewport.width / 2),
    ).toBeLessThanOrEqual(1);
    expect(
      Math.abs(layout.imageCenterY - viewport.height / 2),
    ).toBeLessThanOrEqual(1);
    expect(layout.imageRatio).toBeCloseTo(1920 / 804, 2);
    expect(layout.previousRight).toBeLessThan(layout.width / 2);
    expect(layout.nextLeft).toBeGreaterThan(layout.width / 2);
    expect(layout.width).toBe(viewport.width);
    expect(layout.height).toBe(viewport.height);
    expect(layout.pageWidth).toBeLessThanOrEqual(viewport.width);
    await page.keyboard.press("Escape");
    await expect(viewer).not.toBeVisible();
  }
});

test("mobile fullscreen viewer anchors controls safely and keeps the image tappable", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium");
  const viewports = [
    { width: 430, height: 932 },
    { width: 390, height: 844 },
    { width: 375, height: 812 },
    { width: 320, height: 700 },
  ];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const opener = page.getByRole("button", {
      name: "画像を拡大: 広い掘削地に並ぶ装置群とビーコンの光",
    });
    await opener.click();
    const viewer = page.getByRole("dialog", { name: "Gallery image viewer" });
    await expect(viewer).toBeVisible();
    await expectViewerImageReady(
      viewer.locator(".gallery-viewer-image-content"),
    );
    const metrics = await viewer.evaluate((dialog) => {
      const image = dialog.querySelector("img")!.getBoundingClientRect();
      const imageStyle = getComputedStyle(dialog.querySelector("img")!);
      const close = dialog
        .querySelector(".gallery-viewer-close")!
        .getBoundingClientRect();
      const previous = dialog
        .querySelector(".gallery-viewer-prev")!
        .getBoundingClientRect();
      const next = dialog
        .querySelector(".gallery-viewer-next")!
        .getBoundingClientRect();
      const counter = dialog
        .querySelector(".gallery-viewer-counter")!
        .getBoundingClientRect();
      return {
        dialog: dialog.getBoundingClientRect().toJSON(),
        image: image.toJSON(),
        imageRatio: image.width / image.height,
        imageObjectFit: imageStyle.objectFit,
        touchAction: imageStyle.touchAction,
        close: close.toJSON(),
        previous: previous.toJSON(),
        next: next.toJSON(),
        counter: counter.toJSON(),
        pageWidth: document.documentElement.scrollWidth,
      };
    });
    expect(metrics.dialog.width).toBe(viewport.width);
    expect(metrics.dialog.height).toBe(viewport.height);
    expect(metrics.imageRatio).toBeCloseTo(1133 / 840, 2);
    expect(metrics.imageObjectFit).toBe("contain");
    expect(metrics.touchAction).not.toBe("none");
    expect(
      Math.abs(metrics.image.x + metrics.image.width / 2 - viewport.width / 2),
    ).toBeLessThanOrEqual(1);
    expect(
      Math.abs(
        metrics.image.y + metrics.image.height / 2 - viewport.height / 2,
      ),
    ).toBeLessThanOrEqual(1);
    expect(metrics.previous.height).toBeGreaterThanOrEqual(48);
    expect(metrics.next.height).toBeGreaterThanOrEqual(48);
    expect(metrics.counter.y).toBeGreaterThan(metrics.previous.y);
    expect(Math.abs(metrics.previous.y - metrics.next.y)).toBeLessThanOrEqual(
      1,
    );
    expect(
      Math.abs(
        metrics.counter.x + metrics.counter.width / 2 - viewport.width / 2,
      ),
    ).toBeLessThanOrEqual(1);
    expect(metrics.close.x + metrics.close.width).toBeLessThanOrEqual(
      viewport.width - 12,
    );
    expect(metrics.close.y).toBeGreaterThanOrEqual(0);
    expect(metrics.pageWidth).toBeLessThanOrEqual(viewport.width);

    const imageButton = viewer.getByRole("button", { name: "次の画像を表示" });
    await imageButton.tap();
    await expect(viewer.locator(".gallery-viewer-counter")).toHaveText(
      "02 / 05",
    );
    await viewer.getByRole("button", { name: "次の画像", exact: true }).tap();
    await expect(viewer.locator(".gallery-viewer-counter")).toHaveText(
      "03 / 05",
    );
    await viewer.getByRole("button", { name: "画像ビューアーを閉じる" }).tap();
    await expect(viewer).not.toBeVisible();
    await expect(opener).toBeFocused();
  }
});

test("Gallery rail supports keyboard and touch scrolling without page overflow", async ({
  page,
}) => {
  await page.goto("/");
  const track = page.getByRole("region", { name: "Celenas Gallery" });
  const counter = page.locator(".gallery-counter");
  await expect(track.locator(".gallery-slide")).toHaveCount(5);
  await expect(page.locator("#gallery figcaption")).toHaveCount(0);

  await track.focus();
  await page.keyboard.press("ArrowRight");
  await expect(counter).toHaveText("02 / 05");
  await page.keyboard.press("ArrowLeft");
  await expect(counter).toHaveText("01 / 05");

  for (const viewport of [
    { width: 1920, height: 1080 },
    { width: 1440, height: 900 },
    { width: 1366, height: 768 },
    { width: 430, height: 932 },
    { width: 390, height: 844 },
    { width: 375, height: 812 },
    { width: 320, height: 700 },
  ]) {
    await page.setViewportSize(viewport);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await expect(track.locator(".gallery-slide").first()).toBeVisible();
    const metrics = await track.evaluate((element) => ({
      overflowX: getComputedStyle(element).overflowX,
      snapType: getComputedStyle(element).scrollSnapType,
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
    }));
    expect(metrics.overflowX).toBe("auto");
    expect(metrics.snapType).toContain("x mandatory");
    expect(metrics.scrollWidth).toBeGreaterThan(metrics.clientWidth);
    const stages = await track.locator(".gallery-slide").evaluateAll((slides) =>
      slides.map((slide) => {
        const rect = slide.getBoundingClientRect();
        const image = slide.querySelector("img")?.getBoundingClientRect();
        return {
          height: rect.height,
          centerY: rect.top + rect.height / 2,
          imageCenterY: image ? image.top + image.height / 2 : null,
          borderWidth: getComputedStyle(slide).borderWidth,
          imageRadius: image
            ? getComputedStyle(slide.querySelector("img")!).borderTopLeftRadius
            : "0px",
        };
      }),
    );
    expect(new Set(stages.map(({ height }) => height)).size).toBe(1);
    for (const item of stages) {
      expect(item.borderWidth).toBe("0px");
      expect(Number.parseFloat(item.imageRadius)).toBeGreaterThan(0);
      expect(item.imageCenterY).not.toBeNull();
      expect(Math.abs(item.centerY - item.imageCenterY!)).toBeLessThanOrEqual(
        1,
      );
    }
    await track.evaluate((element) => {
      element.scrollLeft = 0;
    });
    await expect(counter).toHaveText("01 / 05");
    await track.evaluate((element) => {
      element.scrollLeft = element.clientWidth;
    });
    await expect(counter).not.toHaveText("01 / 05");
  }

  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await track.evaluate((element) => getComputedStyle(element).scrollBehavior),
  ).toBe("auto");
  expect(
    await page
      .locator(".gallery-progress-value")
      .evaluate((element) => getComputedStyle(element).transitionDuration),
  ).toBe("0s");
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

test("transmission labels static public information and distinguishes Join access", async ({
  page,
}) => {
  await page.goto("/");
  const community = page.locator(".transmission-panel-community");
  await expect(community).toHaveAttribute("data-state", "info");
  await expect(community.getByText("INFO", { exact: true })).toBeVisible();
  await expect(community.getByText("PUBLIC INFO / COMMUNITY")).toBeVisible();
  await expect(page.locator(".transmission-panel-join")).toContainText(
    "参加申請と承認後の接続案内はDiscordで確認できます。",
  );
  await expect(
    page.locator(".transmission-panel-join").getByRole("link"),
  ).toHaveAttribute("href", discordInviteUrl);
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
  await expect(page.locator(".star-field-cluster")).toHaveCount(1);
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
  await expect(page.locator(".star-twinkle")).toHaveCount(2);
  expect(
    await page.locator(".star-twinkle-two").evaluate((star) => {
      return getComputedStyle(star).animationName;
    }),
  ).toBe(mobilePerformanceMode ? "none" : "star-breathe");
  await expect(page.locator(".star-steady")).toHaveCount(1);
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
  await expect(page.locator(".hero-scroll-fog")).toHaveCount(0);
  const nebula = page.locator(".deep-space-nebula-baked");
  await expect(nebula).toHaveAttribute("aria-hidden", "true");
  await expect(nebula).toHaveCSS("mix-blend-mode", "normal");
  await expect(nebula).toHaveCSS("background-image", /hero-nebula\.webp/);
  await expect(nebula).toHaveCSS(
    "animation-name",
    mobilePerformanceMode ? "none" : "nebula-baked-drift",
  );
  await expect(nebula).toHaveCSS(
    "opacity",
    mobilePerformanceMode ? "0.36" : "0.22",
  );
  await expect(nebula).toHaveCSS("filter", "none");
  const nebulaResponse = await page.request.get("/space/hero-nebula.webp");
  expect(nebulaResponse.ok()).toBe(true);
  expect(nebulaResponse.headers()["content-type"]).toContain("image/webp");
  expect((await nebulaResponse.body()).byteLength).toBeLessThan(200_000);
  expect(await page.locator(".deep-space-nebula").count()).toBe(0);
  await expect(page.locator(".aurora-ribbon")).toHaveCount(0);
  await expect(page.locator(".nebula-atmosphere")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  await expect(page.locator(".nebula-cloud")).toHaveCount(3);
  await expect(page.locator(".nebula-atmosphere")).toHaveCSS("filter", "none");
  await expect(page.locator(".stardust-near")).toHaveCSS(
    "animation-name",
    "none",
  );
  const nebulaClouds = [
    [".nebula-cloud-one", "nebula-cloud-drift-one", "108s"],
    [".nebula-cloud-two", "nebula-cloud-drift-two", "132s"],
    [".nebula-cloud-three", "nebula-cloud-drift-three", "154s"],
  ] as const;
  for (const [selector, animationName, duration] of nebulaClouds) {
    const cloud = page.locator(selector);
    await expect(cloud).toHaveCSS(
      "animation-name",
      mobilePerformanceMode ? "none" : animationName,
    );
    await expect(cloud).toHaveCSS(
      "animation-duration",
      mobilePerformanceMode ? "0s" : duration,
    );
    await expect(cloud).toHaveCSS("filter", "none");
    if (!mobilePerformanceMode) {
      expect(
        await cloud.evaluate((element) => {
          const animation = element.getAnimations()[0];
          const duration = animation?.effect?.getTiming().duration;
          if (!animation || typeof duration !== "number") return false;
          animation.pause();
          animation.currentTime = 0;
          const initial = getComputedStyle(element).transform;
          animation.currentTime = duration / 2;
          const drift = getComputedStyle(element).transform;
          animation.play();
          return initial !== drift;
        }),
      ).toBe(true);
    }
  }
  await expect(page.locator(".celestial-scene")).toHaveAttribute(
    "data-cycle-duration",
    "120000",
  );
  await expect(page.locator(".celestial-scene")).toHaveAttribute(
    "data-initial-phase",
    "0.125",
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
  await expect(page.locator(".deep-space-nebula-baked")).toHaveCSS(
    "opacity",
    "0.36",
  );
  await expect(page.locator(".nebula-atmosphere")).toHaveCSS("filter", "none");
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
    ".nebula-cloud-one",
    ".nebula-cloud-two",
    ".nebula-cloud-three",
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
      ".nebula-cloud-one",
      ".nebula-cloud-two",
      ".nebula-cloud-three",
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
  expect(pausedHeroAnimations).toEqual(Array(9).fill("paused"));
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
    [1366, 768],
    [430, 932],
    [390, 844],
    [375, 812],
    [320, 700],
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
        edgeFades: getComputedStyle(background, "::after").backgroundImage,
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
    expect(geometry.edgeFades.match(/linear-gradient/g)).toHaveLength(3);
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
    const rulesColumnCount = await page
      .locator(".rules-list")
      .evaluate(
        (list) =>
          getComputedStyle(list).gridTemplateColumns.trim().split(/\s+/).length,
      );
    expect(rulesColumnCount).toBe(width <= 768 ? 1 : 2);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      `expected no horizontal overflow at ${width}px`,
    ).toBe(true);
  }
  await expect(
    page.getByRole("link", { name: "Discordに参加する" }),
  ).toBeVisible();
});

test("keeps the planetary scene framed on target desktop and mobile sizes", async ({
  page,
}, testInfo) => {
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
      page.getByRole("link", { name: "Discordに参加する" }),
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
    if (width === 1920 || width === 390) {
      await page.screenshot({
        path: testInfo.outputPath(`hero-background-${width}.png`),
        animations: "disabled",
      });
    }
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
    ".nebula-cloud-one",
    ".nebula-cloud-two",
    ".nebula-cloud-three",
    ".deep-space-nebula-baked",
    ".star-twinkle-one",
    ".star-twinkle-two",
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
