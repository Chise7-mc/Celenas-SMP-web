import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getCycleFraction,
  getShadowPath,
  getShadowTransform,
  LUNAR_CYCLE_DURATION_MS,
  LunarPhaseScene,
  LunarPhaseVisual,
  REDUCED_MOTION_PHASE,
} from "@/components/lunar-phase-scene";

beforeEach(() => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: true,
      media: "(prefers-reduced-motion: reduce)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("hero phase cycle", () => {
  it("maps 0, 75, 150, 225 and 300 seconds to one seamless cycle", () => {
    const fractions = [0, 75_000, 150_000, 225_000, 300_000].map(
      getCycleFraction,
    );

    expect(LUNAR_CYCLE_DURATION_MS).toBe(300_000);
    expect(fractions).toEqual([0, 0.25, 0.5, 0.75, 0]);
  });

  it("changes terminator geometry and mirrors only the waning phases", () => {
    const fractions = [
      0,
      0.25,
      0.5,
      0.75,
      getCycleFraction(LUNAR_CYCLE_DURATION_MS),
    ];
    const states = fractions.map((fraction) => ({
      path: getShadowPath(fraction),
      direction: getShadowTransform(fraction),
    }));

    expect(states[0]).toEqual(states[4]);
    expect(states[0]?.path).not.toBe(states[1]?.path);
    expect(states[1]?.path).not.toBe(states[2]?.path);
    expect(states[1]?.path).toBe(states[3]?.path);
    expect(states.map((state) => state.direction)).toEqual([
      null,
      null,
      null,
      "translate(100 0) scale(-1 1)",
      null,
    ]);
    expect(
      new Set(
        states.slice(0, 4).map((state) => `${state.path}|${state.direction}`),
      ).size,
    ).toBe(4);
  });
});

describe("lunar phase visual", () => {
  it("keeps the fictional planet and displays a static phase for reduced motion", () => {
    const { container } = render(<LunarPhaseVisual />);
    const moon = container.querySelector(".moon");

    expect(moon).toHaveAttribute("data-phase", "first-quarter");
    expect(moon).toHaveAttribute("data-illumination", "0.500");
    expect(moon).toHaveAttribute("data-cycle-position", "0.250");
    expect(moon).toHaveAttribute("data-cycle-duration", "300000");
    expect(
      container.querySelector(".planet-shadow-morph path"),
    ).toHaveAttribute("d", getShadowPath(REDUCED_MOTION_PHASE));
    expect(container.querySelector("[role='img']")).toBeNull();
    expect(container.querySelector(".moon-svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(container.querySelectorAll(".orbiting-body")).toHaveLength(3);
  });

  it("renders the official texture without attaching phase transforms to it", () => {
    const { container } = render(<LunarPhaseScene />);
    const texture = container.querySelector(".moon image");

    expect(texture).toHaveAttribute("href", "/space/lunar-surface.png");
    expect(texture).not.toHaveAttribute("transform");
    expect(container.querySelector(".planet-shadow-morph")).toBeInTheDocument();
  });
});
