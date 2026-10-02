import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  getTransmissionState,
  TransmissionPanel,
} from "@/components/transmission-panel";
import type { CommunityConnection } from "@/config/site";

const pendingConnection: CommunityConnection = {
  serverAddress: null,
  minecraftVersion: null,
  discordUrl: null,
};

describe("transmission panel", () => {
  it("derives PENDING, PARTIAL, and READY from configured public data", () => {
    expect(getTransmissionState(pendingConnection)).toBe("PENDING");
    expect(
      getTransmissionState({
        ...pendingConnection,
        serverAddress: "play.example.test",
      }),
    ).toBe("PARTIAL");
    expect(
      getTransmissionState({
        serverAddress: "play.example.test",
        minecraftVersion: "Test version",
        discordUrl: "https://example.test/community",
      }),
    ).toBe("READY");
  });

  it("shows a pending transmission and no fabricated metrics or join link", () => {
    const { container } = render(
      <TransmissionPanel connection={pendingConnection} variant="community" />,
    );

    expect(container.firstElementChild).toHaveAttribute(
      "data-state",
      "pending",
    );
    expect(screen.getByText("PENDING")).toBeVisible();
    expect(screen.getByText(/PUBLIC LINK \/ PENDING/)).toBeVisible();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(container.textContent).not.toMatch(
      /PING|LATENCY|UPTIME|PLAYER|SIGNAL\s+\d/i,
    );
  });

  it("keeps Join focused on access readiness instead of duplicating details", () => {
    render(<TransmissionPanel connection={pendingConnection} variant="join" />);

    expect(screen.getByText("JOIN / ACCESS")).toBeVisible();
    expect(screen.getByText("PUBLIC ACCESS / PENDING")).toBeVisible();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByText("サーバーアドレス")).not.toBeInTheDocument();
  });
});
