const SYNODIC_MONTH_DAYS = 29.530588;
const SYNODIC_MONTH_MS = SYNODIC_MONTH_DAYS * 24 * 60 * 60 * 1000;
const REFERENCE_NEW_MOON_UTC = Date.UTC(2001, 0, 24, 13, 7);
// Avoid unstable direction values where millisecond timestamps meet phase edges.
const PHASE_EDGE_EPSILON = 1e-9;

export const lunarPhases = [
  "new",
  "waxing-crescent",
  "first-quarter",
  "waxing-gibbous",
  "full",
  "waning-gibbous",
  "last-quarter",
  "waning-crescent",
] as const;

export type LunarPhase = (typeof lunarPhases)[number];

export type LunarPhaseResult = Readonly<{
  phase: LunarPhase;
  phaseFraction: number;
  illumination: number;
  waxing: boolean;
  phaseName: string;
}>;

const phaseNames: Record<LunarPhase, string> = {
  new: "New Moon",
  "waxing-crescent": "Waxing Crescent",
  "first-quarter": "First Quarter",
  "waxing-gibbous": "Waxing Gibbous",
  full: "Full Moon",
  "waning-gibbous": "Waning Gibbous",
  "last-quarter": "Last Quarter",
  "waning-crescent": "Waning Crescent",
};

export function getLunarPhase(date: Date): LunarPhaseResult {
  const timestamp = date.getTime();
  if (!Number.isFinite(timestamp)) {
    throw new RangeError(
      "A valid date is required to calculate the lunar phase.",
    );
  }

  const elapsed = timestamp - REFERENCE_NEW_MOON_UTC;
  const phaseOffset =
    ((elapsed % SYNODIC_MONTH_MS) + SYNODIC_MONTH_MS) % SYNODIC_MONTH_MS;
  const phaseFraction = phaseOffset / SYNODIC_MONTH_MS;
  const illumination = (1 - Math.cos(2 * Math.PI * phaseFraction)) / 2;
  const phaseIndex =
    Math.floor(phaseFraction * lunarPhases.length + 0.5) % lunarPhases.length;
  const phase = lunarPhases[phaseIndex];
  if (phase === undefined) {
    throw new RangeError(
      `Calculated lunar phase index is out of range: ${phaseIndex}`,
    );
  }

  return {
    phase,
    phaseFraction,
    illumination,
    waxing:
      phaseFraction > PHASE_EDGE_EPSILON &&
      phaseFraction < 0.5 - PHASE_EDGE_EPSILON,
    phaseName: phaseNames[phase],
  };
}
