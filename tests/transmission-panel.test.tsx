import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TransmissionPanel } from "@/components/transmission-panel";
import { site } from "@/config/site";

describe("transmission panel", () => {
  it("shows static community information without implying live server status", () => {
    const { container } = render(
      <TransmissionPanel connection={site.connection} variant="community" />,
    );

    expect(container.firstElementChild).toHaveAttribute("data-state", "info");
    expect(screen.getByText("INFO")).toBeVisible();
    expect(screen.getByText("COMMUNITY / INFO")).toBeVisible();
    expect(screen.getByText("Minecraft Java Edition")).toBeVisible();
    expect(screen.getByText("26.3")).toBeVisible();
    expect(screen.getByText("PUBLIC INFO / COMMUNITY")).toBeVisible();
    expect(screen.queryByText("サーバーアドレス")).not.toBeInTheDocument();
  });

  it("does not expose a Discord invite before server verification", () => {
    const { container } = render(
      <TransmissionPanel connection={site.connection} variant="join" />,
    );

    expect(container.firstElementChild).toHaveAttribute("data-state", "info");
    expect(screen.getByText("JOIN / ACCESS")).toBeVisible();
    expect(
      screen.getByText("参加申請と承認後の接続案内はDiscordで確認できます。"),
    ).toBeVisible();
    const discordLogo = container.querySelector("img.discord-mark");
    expect(discordLogo).not.toBeNull();
    expect(discordLogo).toHaveAttribute("alt", "");
    expect(
      screen.queryByRole("link", { name: "Discordで参加申請" }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Discord参加の認証を開始" }),
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "現在、参加認証を準備中です。",
    );
    expect(
      screen.queryByRole("link", { name: "Discordで参加申請" }),
    ).not.toBeInTheDocument();
  });
});
