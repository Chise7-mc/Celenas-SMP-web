"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { getLunarPhase, type LunarPhaseResult } from "@/lib/lunar-phase";
import { withBasePath } from "@/lib/asset-path";

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

type SceneStyle = CSSProperties & {
  "--moon-glow-opacity": string;
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
    "--moon-glow-opacity": (0.06 + phase.illumination * 0.12).toFixed(3),
    "--moonlight-opacity": (0.2 + phase.illumination * 0.3).toFixed(3),
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
      <svg
        className="aurora-curtains"
        viewBox="0 0 100 100"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id="aurora-ribbon-color" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#a7b5ff" stopOpacity="0" />
            <stop offset="35%" stopColor="#a7b5ff" stopOpacity="0.48" />
            <stop offset="62%" stopColor="#dce2ff" stopOpacity="0.76" />
            <stop offset="100%" stopColor="#a7b5ff" stopOpacity="0" />
          </linearGradient>
          <filter
            id="aurora-soft-edge"
            x="-18%"
            y="-18%"
            width="136%"
            height="136%"
          >
            <feGaussianBlur stdDeviation="1.25" />
          </filter>
        </defs>
        <g className="aurora-wave" filter="url(#aurora-soft-edge)">
          <path
            className="aurora-ribbon aurora-ribbon-one"
            d="M 5 54 C 17 39, 17 20, 38 15 C 57 10, 66 24, 77 26 C 86 28, 92 22, 98 14"
          />
          <path
            className="aurora-ribbon aurora-ribbon-two"
            d="M 2 66 C 19 54, 24 34, 43 29 C 62 24, 70 39, 82 42 C 90 44, 95 38, 100 29"
          />
          <path
            className="aurora-ribbon aurora-ribbon-three"
            d="M 1 76 C 17 64, 28 62, 43 67 C 58 72, 67 85, 81 84 C 90 83, 95 77, 100 69"
          />
        </g>
      </svg>
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
              <clipPath id="moon-disc">
                <circle cx="50" cy="50" r="49" />
              </clipPath>
              <linearGradient id="moon-shadow" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#050505" stopOpacity="0.86" />
                <stop offset="100%" stopColor="#080808" stopOpacity="0.96" />
              </linearGradient>
              <filter
                id="moon-terminator-soft"
                x="-12%"
                y="-12%"
                width="124%"
                height="124%"
                colorInterpolationFilters="sRGB"
              >
                <feGaussianBlur stdDeviation="1.35" />
              </filter>
            </defs>
            <g clipPath="url(#moon-disc)">
              <image
                href={withBasePath("/space/lunar-surface.png")}
                x="1"
                y="1"
                width="98"
                height="98"
                preserveAspectRatio="xMidYMid slice"
              />
              <g className="planet-shadow-sway">
                <g
                  transform={
                    waxingSide ? undefined : "translate(100 0) scale(-1 1)"
                  }
                >
                  <path
                    d={getShadowPath(phase.phaseFraction)}
                    fill="url(#moon-shadow)"
                    opacity="0.94"
                    filter="url(#moon-terminator-soft)"
                  />
                </g>
              </g>
            </g>
          </svg>
        </span>
        <span className="orbit orbit-one">
          <span className="orbiting-body orbiting-body-one" />
        </span>
        <span className="orbit orbit-two">
          <span className="orbiting-body orbiting-body-two" />
        </span>
        <span className="orbit orbit-three">
          <span className="orbiting-body orbiting-body-three" />
        </span>
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
