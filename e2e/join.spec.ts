import { expect, test } from "@playwright/test";

// External services are replaced only by Playwright, never by product code.
const script = `
window.grecaptcha = {
  render(element, options) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'テスト認証を完了';
    button.onclick = () => options.callback('synthetic-token');
    element.append(button);
    return 0;
  },
  reset() {}
};
window.celenasRecaptchaLoaded();
`;

test("participation links stay on-site without contacting Google", async ({
  page,
}) => {
  const googleRequests: string[] = [];
  page.on("request", (request) => {
    if (/google\.com|gstatic\.com/.test(request.url()))
      googleRequests.push(request.url());
  });
  await page.goto("/");
  await page.getByRole("link", { name: "Discordに参加する" }).click();
  await expect(page).toHaveURL(/#join$/);
  await expect(
    page.getByRole("button", { name: "Discordで参加申請" }),
  ).toBeDisabled();
  expect(googleRequests).toEqual([]);
});

test.describe("configured reCAPTCHA participation", () => {
  test.skip(
    !process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
    "Requires a build with a synthetic public site key",
  );

  test("verifies before opening Discord in the same tab", async ({ page }) => {
    await page.route("https://www.google.com/recaptcha/api.js**", (route) =>
      route.fulfill({ contentType: "text/javascript", body: script }),
    );
    let submitted: unknown;
    await page.route("**/api/join", async (route) => {
      submitted = route.request().postDataJSON();
      await route.fulfill({
        json: { url: "https://discord.gg/example-invite" },
      });
    });
    await page.route("https://discord.gg/example-invite", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: "<title>Verified invitation</title>",
      }),
    );
    await page.goto("/#join");
    await page.getByRole("button", { name: "認証を開始する" }).click();
    await page.getByRole("button", { name: "テスト認証を完了" }).click();
    await page.getByRole("button", { name: "Discordで参加申請" }).click();
    await expect(page).toHaveURL("https://discord.gg/example-invite");
    expect(submitted).toEqual({ token: "synthetic-token" });
  });

  test("recovers from a blocked Google script", async ({ page }) => {
    let attempts = 0;
    await page.route("https://www.google.com/recaptcha/api.js**", (route) => {
      attempts++;
      return attempts === 1
        ? route.abort()
        : route.fulfill({ contentType: "text/javascript", body: script });
    });
    await page.goto("/#join");
    await page.getByRole("button", { name: "認証を開始する" }).click();
    await page.getByRole("button", { name: "認証を再試行する" }).click();
    await page.getByRole("button", { name: "テスト認証を完了" }).click();
    await expect(
      page.getByRole("button", { name: "Discordで参加申請" }),
    ).toBeEnabled();
  });
});
