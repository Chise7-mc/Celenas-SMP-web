import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JoinVerification } from "@/components/join-verification";
import { loadRecaptcha, type RecaptchaOptions } from "@/lib/recaptcha";
import { navigateToDiscord } from "@/lib/discord-invite";

vi.mock("@/lib/recaptcha", () => ({ loadRecaptcha: vi.fn() }));
vi.mock("@/lib/discord-invite", async (original) => ({
  ...(await original<object>()),
  navigateToDiscord: vi.fn(),
}));

let callbacks: RecaptchaOptions;
const reset = vi.fn();

async function openChallenge() {
  fireEvent.click(screen.getByRole("button", { name: "認証を開始する" }));
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Discordで参加申請" }),
    ).toBeDisabled(),
  );
  await waitFor(() => expect(callbacks).toBeDefined());
}
async function complete() {
  await openChallenge();
  act(() => callbacks.callback("synthetic-token"));
}

describe("participation verification", () => {
  beforeEach(() => {
    callbacks = undefined as unknown as RecaptchaOptions;
    vi.mocked(loadRecaptcha).mockResolvedValue({
      render: (_container, options) => {
        callbacks = options;
        return 0;
      },
      reset,
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("keeps missing configuration closed without loading Google", () => {
    render(<JoinVerification siteKey="" />);
    expect(
      screen.getByRole("button", { name: "Discordで参加申請" }),
    ).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("準備中");
    expect(loadRecaptcha).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("link", { name: /Discord/ }),
    ).not.toBeInTheDocument();
  });

  it("loads Google's challenge only after the visitor starts it", async () => {
    render(<JoinVerification siteKey="synthetic-key" />);
    expect(loadRecaptcha).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Discordで参加申請" }),
    ).toBeDisabled();
    await complete();
    expect(
      screen.getByRole("button", { name: "Discordで参加申請" }),
    ).toBeEnabled();
    act(() => callbacks["expired-callback"]());
    expect(
      screen.getByRole("button", { name: "Discordで参加申請" }),
    ).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("期限");
  });

  it("opens only a verified Discord invitation and blocks duplicate submission", async () => {
    let resolve!: (value: Response) => void;
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>((done) => {
          resolve = done;
        }),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<JoinVerification siteKey="synthetic-key" />);
    await complete();
    const button = screen.getByRole("button", { name: "Discordで参加申請" });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/join",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ token: "synthetic-token" }),
        credentials: "same-origin",
      }),
    );
    expect(button).toBeDisabled();
    await act(async () =>
      resolve(Response.json({ url: "https://discord.gg/example-invite" })),
    );
    expect(navigateToDiscord).toHaveBeenCalledWith(
      "https://discord.gg/example-invite",
    );
  });

  it.each([
    () => Response.json({ error: "verification_failed" }, { status: 403 }),
    () => Response.json({ url: "https://elsewhere.example" }),
    () => new Response("broken JSON"),
  ])(
    "discards the token and allows retry after verification failure",
    async (response) => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => response()),
      );
      render(<JoinVerification siteKey="synthetic-key" />);
      await complete();
      fireEvent.click(
        screen.getByRole("button", { name: "Discordで参加申請" }),
      );
      await waitFor(() =>
        expect(screen.getByRole("status")).toHaveTextContent("もう一度"),
      );
      expect(
        screen.getByRole("button", { name: "Discordで参加申請" }),
      ).toBeDisabled();
      expect(reset).toHaveBeenCalledWith(0);
      expect(navigateToDiscord).not.toHaveBeenCalled();
      act(() => callbacks.callback("fresh-token"));
      expect(
        screen.getByRole("button", { name: "Discordで参加申請" }),
      ).toBeEnabled();
    },
  );

  it("does not use an old successful response after the challenge expires", async () => {
    let resolve!: (value: Response) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((done) => {
            resolve = done;
          }),
      ),
    );
    render(<JoinVerification siteKey="synthetic-key" />);
    await complete();
    fireEvent.click(screen.getByRole("button", { name: "Discordで参加申請" }));
    act(() => callbacks["expired-callback"]());
    await act(async () =>
      resolve(Response.json({ url: "https://discord.gg/example-invite" })),
    );
    expect(navigateToDiscord).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Discordで参加申請" }),
    ).toBeDisabled();
  });

  it("allows retry when Google's script fails to load", async () => {
    vi.mocked(loadRecaptcha).mockRejectedValueOnce(new Error("script blocked"));
    render(<JoinVerification siteKey="synthetic-key" />);
    fireEvent.click(screen.getByRole("button", { name: "認証を開始する" }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "認証を再試行する" }),
      ).toBeEnabled(),
    );
    expect(
      screen.getByRole("button", { name: "Discordで参加申請" }),
    ).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "認証を再試行する" }));
    await waitFor(() => expect(callbacks).toBeDefined());
    act(() => callbacks.callback("fresh-token"));
    expect(
      screen.getByRole("button", { name: "Discordで参加申請" }),
    ).toBeEnabled();
  });

  it("keeps failure callbacks closed and exposes retry", async () => {
    render(<JoinVerification siteKey="synthetic-key" />);
    await complete();
    act(() => callbacks["error-callback"]());
    expect(
      screen.getByRole("button", { name: "Discordで参加申請" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "認証を再試行する" }),
    ).toBeEnabled();
  });
});
