import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CommunityDetails } from "@/components/community-details";

describe("community information", () => {
  it("shows honest unavailable states without a fabricated join link", () => {
    render(
      <CommunityDetails
        connection={{
          serverAddress: null,
          minecraftVersion: null,
          discordUrl: null,
        }}
      />,
    );

    expect(screen.getByText("接続先は公開準備中です。")).toBeVisible();
    expect(screen.getByText("対応バージョンは確認中です。")).toBeVisible();
    expect(screen.getByText("Discordの案内は準備中です。")).toBeVisible();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders supplied information and an accessible community link", () => {
    render(
      <CommunityDetails
        connection={{
          serverAddress: "play.example.test",
          minecraftVersion: "Test version",
          discordUrl: "https://example.test/community",
        }}
      />,
    );

    expect(screen.getByText("play.example.test")).toBeVisible();
    expect(screen.getByText("Test version")).toBeVisible();
    expect(
      screen.getByRole("link", { name: /Discord コミュニティへ参加/ }),
    ).toHaveAttribute("href", "https://example.test/community");
  });
});
