import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CommunityDetails } from "@/components/community-details";
import { site } from "@/config/site";

describe("community information", () => {
  it("publishes the edition and version without exposing an invite", () => {
    expect(Object.keys(site.connection)).toEqual(["minecraftVersion"]);
    expect(site.connection.minecraftVersion).toBe("26.3");

    render(<CommunityDetails connection={site.connection} />);

    expect(screen.getByText("Minecraft Java Edition")).toBeVisible();
    expect(screen.getByText("26.3")).toBeVisible();
    expect(
      screen.getByText("参加申請後の案内はDiscordで確認できます。"),
    ).toBeVisible();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByText("サーバーアドレス")).not.toBeInTheDocument();
  });
});
