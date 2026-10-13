import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TurnstileJoin } from "@/components/turnstile-join";

afterEach(() => {
  delete window.turnstile;
});

describe("Turnstile Join control", () => {
  it("does not load Turnstile or reveal an invite when no site key is configured", () => {
    render(<TurnstileJoin siteKey="" />);
    fireEvent.click(
      screen.getByRole("button", { name: "Discord参加の認証を開始" }),
    );
    expect(document.querySelector("#cloudflare-turnstile-api")).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent(
      "現在、参加認証を準備中です。",
    );
    expect(
      screen.queryByRole("link", { name: "Discordで参加申請" }),
    ).not.toBeInTheDocument();
  });

  it("shows a recoverable Japanese error if the script fails to load", () => {
    render(<TurnstileJoin siteKey="test-site-key" />);
    fireEvent.click(
      screen.getByRole("button", { name: "Discord参加の認証を開始" }),
    );
    fireEvent.error(document.querySelector("#cloudflare-turnstile-api")!);
    expect(screen.getByRole("status")).toHaveTextContent(
      "認証を読み込めません。",
    );
    expect(
      screen.getByRole("button", { name: "認証を再読み込み" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("link", { name: "Discordで参加申請" }),
    ).not.toBeInTheDocument();
  });

  it("prevents duplicate submissions while fetching the verified invite", async () => {
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          window.setTimeout(
            () =>
              resolve(
                Response.json({ inviteUrl: "https://discord.gg/example" }),
              ),
            0,
          );
        }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const renderWidget = vi.fn(
      (
        _host: HTMLElement,
        options: Parameters<NonNullable<typeof window.turnstile>["render"]>[1],
      ) => {
        window.setTimeout(() => {
          options.callback("single-use-token");
          options.callback("single-use-token");
        }, 0);
        return "widget-1";
      },
    );
    window.turnstile = {
      render: renderWidget,
      reset: vi.fn(),
      remove: vi.fn(),
    };

    render(<TurnstileJoin siteKey="test-site-key" />);
    fireEvent.click(
      screen.getByRole("button", { name: "Discord参加の認証を開始" }),
    );
    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 10));
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("link", { name: "Discordで参加申請" }),
    ).toHaveAttribute("href", "https://discord.gg/example");
    expect(screen.getByRole("status")).toHaveTextContent("認証しました。");
  });
});
