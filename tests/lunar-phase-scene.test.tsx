import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getCycleFraction,
  getPhaseFraction,
  getShadowPath,
  getShadowTransform,
  INITIAL_PHASE,
  LUNAR_CYCLE_DURATION_MS,
  LunarPhaseBackground,
  LunarPhaseScene,
  LunarPhaseVisual,
  MOBILE_PHASE_UPDATE_INTERVAL_MS,
  PHASE_UPDATE_INTERVAL_MS,
  REDUCED_MOTION_PHASE,
  SHADOW_TILT_DEGREES,
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
  it("starts waxing crescent and completes a seamless 120-second cycle", () => {
    const fractions = [0, 30_000, 60_000, 90_000, 120_000].map(
      getPhaseFraction,
    );
    const cycleFractions = [0, 30_000, 60_000, 90_000, 120_000].map(
      getCycleFraction,
    );

    expect(LUNAR_CYCLE_DURATION_MS).toBe(120_000);
    expect(PHASE_UPDATE_INTERVAL_MS).toBe(100);
    expect(MOBILE_PHASE_UPDATE_INTERVAL_MS).toBe(200);
    expect(INITIAL_PHASE).toBe(0.125);
    expect(fractions).toEqual([0.125, 0.375, 0.625, 0.875, 0.125]);
    expect(cycleFractions).toEqual([0, 0.25, 0.5, 0.75, 0]);
    expect(getShadowPath(fractions[0] ?? 0)).toBe(
      getShadowPath(fractions[4] ?? 0),
    );
    expect(getShadowTransform(fractions[0] ?? 0)).toBe(
      getShadowTransform(fractions[4] ?? 0),
    );
    expect(getShadowPath(fractions[0] ?? 0)).not.toBe(
      getShadowPath(fractions[2] ?? 0),
    );
  });

  it("morphs through the cycle and mirrors only the waning phases", () => {
    const fractions = [
      0.125,
      0.375,
      0.625,
      0.875,
      getPhaseFraction(LUNAR_CYCLE_DURATION_MS),
    ];
    const states = fractions.map((fraction) => ({
      path: getShadowPath(fraction),
      direction: getShadowTransform(fraction),
    }));

    expect(states[0]).toEqual(states[4]);
    expect(states[0]?.path).not.toBe(states[1]?.path);
    expect(states[1]?.path).toBe(states[2]?.path);
    expect(states[1]?.direction).not.toBe(states[2]?.direction);
    expect(states[0]?.path).toBe(states[4]?.path);
    expect(states.map((state) => state.direction)).toEqual([
      null,
      null,
      "translate(100 0) scale(-1 1)",
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

    expect(moon).toHaveAttribute("data-phase", "waxing-crescent");
    expect(moon).toHaveAttribute("data-illumination", "0.146");
    expect(moon).toHaveAttribute("data-cycle-position", "0.125");
    expect(moon).toHaveAttribute("data-cycle-duration", "120000");
    expect(
      container.querySelector(".planet-shadow-morph path"),
    ).toHaveAttribute("d", getShadowPath(REDUCED_MOTION_PHASE));
    expect(container.querySelector("[role='img']")).toBeNull();
    expect(container.querySelector(".moon-svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(container.querySelectorAll(".orbiting-body")).toHaveLength(3);
    expect(container.querySelectorAll("animateMotion")).toHaveLength(3);
    expect(
      [...container.querySelectorAll("animateMotion")].map((motion) =>
        motion.getAttribute("dur"),
      ),
    ).toEqual(["72s", "103s", "137s"]);
    expect(
      [...container.querySelectorAll("animateMotion")].map((motion) =>
        motion.getAttribute("begin"),
      ),
    ).toEqual(["-5.76s", "-44.29s", "-104.12s"]);
    expect(container.querySelectorAll(".orbit-line")).toHaveLength(3);
    expect(container.querySelector(".planet-shadow-morph")).toHaveAttribute(
      "transform",
      `rotate(${SHADOW_TILT_DEGREES} 50 50)`,
    );
    expect(SHADOW_TILT_DEGREES).toBe(12);
  });

  it("renders the official texture without attaching phase transforms to it", () => {
    const { container } = render(<LunarPhaseScene />);
    const texture = container.querySelector(".moon image");

    expect(texture).toHaveAttribute("href", "/space/lunar-surface.webp");
    expect(texture).not.toHaveAttribute("transform");
    expect(container.querySelector(".planet-shadow-morph")).toBeInTheDocument();
  });

  it("renders decorative deep-space layers and procedural nebula texture", () => {
    const { container } = render(
      <>
        <LunarPhaseBackground />
        <LunarPhaseScene />
      </>,
    );

    expect(
      container.querySelector(".hero-space-background"),
    ).toBeInTheDocument();
    expect(container.querySelector(".deep-space-backdrop")).toBeInTheDocument();
    expect(
      container.querySelector(".celestial-scene .deep-space-backdrop"),
    ).toBeNull();
    expect(container.querySelector(".aurora-curtains")).toBeInTheDocument();
    const nebula = container.querySelector(".deep-space-nebula-baked");
    expect(nebula).toHaveAttribute("aria-hidden", "true");
    expect(nebula).toHaveStyle({
      backgroundImage: 'url("/space/hero-nebula.webp")',
    });
    expect(container.querySelector(".deep-space-nebula")).toBeNull();
  });
});
