import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  LunarPhaseScene,
  LunarPhaseVisual,
} from "@/components/lunar-phase-scene";
import { getLunarPhase } from "@/lib/lunar-phase";

afterEach(() => {
  vi.useRealTimers();
});

describe("lunar phase visual", () => {
  it("renders a decorative SVG and phase-driven atmosphere", () => {
    const phase = getLunarPhase(new Date("2001-01-24T13:07:00.000Z"));
    const { container } = render(<LunarPhaseVisual phase={phase} />);
    const moon = container.querySelector(".moon");

    expect(moon).toHaveAttribute("data-phase", "new");
    expect(container.querySelector("[role='img']")).toBeNull();
    expect(container.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(container.querySelector("svg")).toHaveAttribute(
      "viewBox",
      "0 0 100 100",
    );
    expect(container.querySelector(".celestial-scene")).toHaveStyle({
      "--moon-glow-opacity": "0.120",
      "--moonlight-opacity": "0.080",
      "--star-field-far-opacity": "0.440",
      "--stardust-opacity": "0.240",
    });
    expect(container.querySelectorAll(".stardust-layer")).toHaveLength(3);
  });

  it("renders distinct illumination and waxing direction for each phase", () => {
    const newMoon = getLunarPhase(new Date("2001-01-24T13:07:00.000Z"));
    const firstQuarterDate = new Date(
      Date.parse("2001-01-24T13:07:00.000Z") +
        29.530588 * 24 * 60 * 60 * 1000 * 0.25,
    );
    const firstQuarter = getLunarPhase(firstQuarterDate);
    const waningCrescentDate = new Date(
      Date.parse("2001-01-24T13:07:00.000Z") +
        29.530588 * 24 * 60 * 60 * 1000 * 0.875,
    );
    const waningCrescent = getLunarPhase(waningCrescentDate);
    const fullMoonDate = new Date(
      Date.parse("2001-01-24T13:07:00.000Z") +
        29.530588 * 24 * 60 * 60 * 1000 * 0.5,
    );
    const fullMoon = getLunarPhase(fullMoonDate);

    const { container, rerender } = render(
      <LunarPhaseVisual phase={newMoon} />,
    );
    const moon = container.querySelector(".moon");
    expect(moon).toHaveAttribute("data-illumination", "0.000");
    expect(container.querySelector(".moon path")).not.toHaveAttribute(
      "transform",
    );

    rerender(<LunarPhaseVisual phase={firstQuarter} />);
    expect(moon).toHaveAttribute("data-phase", "first-quarter");
    expect(container.querySelector(".moon path")).not.toHaveAttribute(
      "transform",
    );
    expect(moon).toHaveAttribute("data-illumination", "0.500");

    rerender(<LunarPhaseVisual phase={waningCrescent} />);
    expect(moon).toHaveAttribute("data-phase", "waning-crescent");
    expect(moon).toHaveAttribute("data-illumination", "0.146");
    expect(container.querySelector(".moon path")).toHaveAttribute(
      "transform",
      "translate(100 0) scale(-1 1)",
    );

    rerender(<LunarPhaseVisual phase={fullMoon} />);
    expect(moon).toHaveAttribute("data-phase", "full");
    expect(moon).toHaveAttribute("data-illumination", "1.000");
    expect(container.querySelector(".celestial-scene")).toHaveStyle({
      "--stardust-opacity": "0.160",
    });
  });

  it("refreshes the server-provided phase after hydration and cleans up its timers", async () => {
    const reference = Date.parse("2001-01-24T13:07:00.000Z");
    const synodicMonthMs = 29.530588 * 24 * 60 * 60 * 1000;
    const currentDate = new Date(reference + synodicMonthMs * 0.25);
    vi.useFakeTimers();
    vi.setSystemTime(currentDate);

    const { container, unmount } = render(
      <LunarPhaseScene
        initialPhase={getLunarPhase(new Date("2001-01-24T13:07:00.000Z"))}
      />,
    );
    const moon = container.querySelector(".moon");
    expect(moon).toHaveAttribute("data-phase", "new");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(moon).toHaveAttribute("data-phase", "first-quarter");

    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
