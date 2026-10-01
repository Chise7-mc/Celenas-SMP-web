"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { getLunarPhase, type LunarPhaseResult } from "@/lib/lunar-phase";

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

type SceneStyle = CSSProperties & {
  "--moon-glow-opacity": string;
  "--moon-glow-spread": string;
  "--moonlight-opacity": string;
  "--star-field-far-opacity": string;
  "--star-field-mid-opacity": string;
  "--stardust-opacity": string;
};

function getShadowPath(phaseFraction: number): string {
  const waxingFraction =
    phaseFraction <= 0.5 ? phaseFraction : 1 - phaseFraction;
  const terminator = Math.cos(2 * Math.PI * waxingFraction);
  const radius = Math.abs(terminator * 50);
  const terminatorArc =
    radius < 0.001
      ? "L 50 0"
      : `A ${radius} 50 0 0 ${terminator > 0 ? 0 : 1} 50 0`;

  return `M 50 0 A 50 50 0 0 0 50 100 ${terminatorArc} Z`;
}

export function LunarPhaseVisual({ phase }: { phase: LunarPhaseResult }) {
  const waxingSide = phase.phaseFraction <= 0.5;
  const style: SceneStyle = {
    "--moon-glow-opacity": (0.12 + phase.illumination * 0.24).toFixed(3),
    "--moon-glow-spread": `${8 + phase.illumination * 24}px`,
    "--moonlight-opacity": (0.08 + phase.illumination * 0.16).toFixed(3),
    "--star-field-far-opacity": (0.34 + (1 - phase.illumination) * 0.1).toFixed(
      3,
    ),
    "--star-field-mid-opacity": (
      0.48 +
      (1 - phase.illumination) * 0.12
    ).toFixed(3),
    "--stardust-opacity": (0.16 + (1 - phase.illumination) * 0.08).toFixed(3),
  };

  return (
    <div className="celestial-scene" style={style}>
      <div className="star-field star-field-far" />
      <div className="stardust-layer stardust-far" />
      <div className="star-field star-field-mid" />
      <div className="stardust-layer stardust-mid" />
      <div className="star-accents">
        <span className="star-twinkle star-twinkle-one" />
        <span className="star-twinkle star-twinkle-two" />
        <span className="star-twinkle star-twinkle-three" />
        <span className="star-steady star-steady-one" />
        <span className="star-steady star-steady-two" />
      </div>
      <div className="celestial-stage">
        <span
          className="moon"
          data-phase={phase.phase}
          data-illumination={phase.illumination.toFixed(3)}
        >
          <svg
            className="moon-svg"
            viewBox="0 0 100 100"
            aria-hidden="true"
            focusable="false"
          >
            <defs>
              <radialGradient id="moon-surface" cx="31%" cy="26%" r="82%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="48%" stopColor="#e9ebff" />
                <stop offset="100%" stopColor="#aab7e0" />
              </radialGradient>
              <linearGradient id="moon-shadow" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#131b2c" />
                <stop offset="100%" stopColor="#080c17" />
              </linearGradient>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="49"
              fill="url(#moon-surface)"
              stroke="rgba(255,255,255,0.8)"
              strokeWidth="1"
            />
            <path
              d={getShadowPath(phase.phaseFraction)}
              fill="url(#moon-shadow)"
              transform={
                waxingSide ? undefined : "translate(100 0) scale(-1 1)"
              }
            />
          </svg>
        </span>
        <span className="orbit orbit-one" />
        <span className="orbit orbit-two" />
        <span className="orbit orbit-three" />
        <span className="orbit-light" />
      </div>
      <div className="stardust-layer stardust-near" />
    </div>
  );
}

export function LunarPhaseScene({
  initialPhase,
}: {
  initialPhase: LunarPhaseResult;
}) {
  const [phase, setPhase] = useState(initialPhase);

  useEffect(() => {
    const updatePhase = () => setPhase(getLunarPhase(new Date()));
    const timeoutId = window.setTimeout(updatePhase, 0);
    const intervalId = window.setInterval(updatePhase, SIX_HOURS_MS);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, []);

  return <LunarPhaseVisual phase={phase} />;
}
