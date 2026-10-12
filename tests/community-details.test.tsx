import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CommunityDetails } from "@/components/community-details";
import { site } from "@/config/site";

describe("community information", () => {
  it("publishes the edition, version, and Discord participation link", () => {
    expect(Object.keys(site.connection)).toEqual([
      "minecraftVersion",
      "joinHref",
    ]);
    expect(site.connection.minecraftVersion).toBe("26.3");
    expect(site.connection.joinHref).toBe("#join");

    render(<CommunityDetails connection={site.connection} />);

    expect(screen.getByText("Minecraft Java Edition")).toBeVisible();
    expect(screen.getByText("26.3")).toBeVisible();
    const invite = screen.getByRole("link", {
      name: "Discord コミュニティへ参加 ↗",
    });
    expect(invite).toHaveAttribute("href", "#join");
    expect(invite).not.toHaveAttribute("target");
    expect(screen.queryByText("サーバーアドレス")).not.toBeInTheDocument();
  });
});
