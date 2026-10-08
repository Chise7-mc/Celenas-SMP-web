import { render, screen } from "@testing-library/react";
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

  it("provides the Discord participation action in Join", () => {
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
    const invite = screen.getByRole("link", { name: "Discordで参加申請" });
    expect(invite).toHaveAttribute("href", site.connection.discordUrl);
    expect(invite).toHaveAttribute("target", "_blank");
    expect(invite).toHaveAttribute("rel", "noreferrer");
  });
});
