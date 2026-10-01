import { describe, expect, it } from "vitest";
import { getLunarPhase } from "@/lib/lunar-phase";

const referenceNewMoon = new Date("2001-01-24T13:07:00.000Z");
const synodicMonthMs = 29.530588 * 24 * 60 * 60 * 1000;

function dateAtCycleFraction(fraction: number) {
  return new Date(referenceNewMoon.getTime() + synodicMonthMs * fraction);
}

describe("getLunarPhase", () => {
  it("maps the reference new moon to a dark new moon", () => {
    const phase = getLunarPhase(referenceNewMoon);

    expect(phase.phase).toBe("new");
    expect(phase.phaseFraction).toBe(0);
    expect(phase.illumination).toBe(0);
    expect(phase.waxing).toBe(false);
  });

  it.each([
    [0, "new"],
    [0.125, "waxing-crescent"],
    [0.25, "first-quarter"],
    [0.375, "waxing-gibbous"],
    [0.5, "full"],
    [0.625, "waning-gibbous"],
    [0.75, "last-quarter"],
    [0.875, "waning-crescent"],
  ] as const)("classifies cycle fraction %s as %s", (fraction, expected) => {
    expect(getLunarPhase(dateAtCycleFraction(fraction)).phase).toBe(expected);
  });

  it("classifies phase boundaries consistently", () => {
    expect(getLunarPhase(dateAtCycleFraction(1 / 16 - 0.00001)).phase).toBe(
      "new",
    );
    expect(getLunarPhase(dateAtCycleFraction(1 / 16 + 0.00001)).phase).toBe(
      "waxing-crescent",
    );
    expect(getLunarPhase(dateAtCycleFraction(3 / 16 + 0.00001)).phase).toBe(
      "first-quarter",
    );
    expect(getLunarPhase(dateAtCycleFraction(15 / 16 + 0.00001)).phase).toBe(
      "new",
    );
  });

  it("reports waxing and waning directions and continuous illumination", () => {
    const waxing = getLunarPhase(dateAtCycleFraction(0.25));
    const full = getLunarPhase(dateAtCycleFraction(0.5));
    const waning = getLunarPhase(dateAtCycleFraction(0.75));

    expect(waxing.waxing).toBe(true);
    expect(full.waxing).toBe(false);
    expect(waning.waxing).toBe(false);
    expect(waxing.illumination).toBeCloseTo(0.5, 6);
    expect(full.illumination).toBe(1);
    expect(waning.illumination).toBeCloseTo(0.5, 6);
  });

  it("keeps fractions and illumination in range and is deterministic", () => {
    const date = new Date("2026-10-01T08:27:00.000Z");
    const first = getLunarPhase(date);
    const second = getLunarPhase(date);

    expect(first).toEqual(second);
    expect(first.phaseFraction).toBeGreaterThanOrEqual(0);
    expect(first.phaseFraction).toBeLessThan(1);
    expect(first.illumination).toBeGreaterThanOrEqual(0);
    expect(first.illumination).toBeLessThanOrEqual(1);
  });

  it("rejects an invalid date", () => {
    expect(() => getLunarPhase(new Date(Number.NaN))).toThrow(RangeError);
  });
});
