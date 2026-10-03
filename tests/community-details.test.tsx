import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CommunityDetails } from "@/components/community-details";
import { site } from "@/config/site";

describe("community information", () => {
  it("publishes the edition, version, and Discord participation link", () => {
    expect(Object.keys(site.connection)).toEqual([
      "minecraftVersion",
      "discordUrl",
    ]);
    expect(site.connection.minecraftVersion).toBe("26.3");
    expect(site.connection.discordUrl).toBe("https://discord.gg/cuXPVNccYv");

    render(<CommunityDetails connection={site.connection} />);

    expect(screen.getByText("Minecraft Java Edition")).toBeVisible();
    expect(screen.getByText("26.3")).toBeVisible();
    const invite = screen.getByRole("link", {
      name: "Discord コミュニティへ参加 ↗",
    });
    expect(invite).toHaveAttribute("href", site.connection.discordUrl);
    expect(invite).toHaveAttribute("target", "_blank");
    expect(invite).toHaveAttribute("rel", "noreferrer");
    expect(screen.queryByText("サーバーアドレス")).not.toBeInTheDocument();
  });
});
