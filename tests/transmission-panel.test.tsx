import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TransmissionPanel } from "@/components/transmission-panel";
import { site } from "@/config/site";

describe("transmission panel", () => {
  it("reports READY with public version and Discord information", () => {
    const { container } = render(
      <TransmissionPanel connection={site.connection} variant="community" />,
    );

    expect(container.firstElementChild).toHaveAttribute("data-state", "ready");
    expect(screen.getByText("READY")).toBeVisible();
    expect(screen.getByText("TRANSMISSION / SERVER")).toBeVisible();
    expect(screen.getByText("Minecraft Java Edition")).toBeVisible();
    expect(screen.getByText("26.3")).toBeVisible();
    expect(screen.getByText("PUBLIC INFO / READY")).toBeVisible();
    expect(screen.queryByText("サーバーアドレス")).not.toBeInTheDocument();
  });

  it("provides the Discord participation action in Join", () => {
    const { container } = render(
      <TransmissionPanel connection={site.connection} variant="join" />,
    );

    expect(container.firstElementChild).toHaveAttribute("data-state", "ready");
    expect(screen.getByText("JOIN / ACCESS")).toBeVisible();
    expect(
      screen.getByText("参加申請と接続方法はDiscordで案内しています。"),
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
