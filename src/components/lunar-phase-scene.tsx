"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { withBasePath } from "@/lib/asset-path";

export const LUNAR_CYCLE_DURATION_MS = 120_000;
export const INITIAL_PHASE = 0.125;
export const REDUCED_MOTION_PHASE = INITIAL_PHASE;
export const SHADOW_TILT_DEGREES = 12;

const ORBITING_BODIES = [
  {
    id: "orbit-one",
    path: "M 500 200 A 630 300 0 1 0 500 800 A 630 300 0 1 0 500 200",
    rotation: -32,
    duration: "72s",
    begin: "-5.76s",
    radius: 3.4,
    satelliteClass: "satellite-one",
  },
  {
    id: "orbit-two",
    path: "M 500 120 A 540 380 0 1 0 500 880 A 540 380 0 1 0 500 120",
    rotation: 54,
    duration: "103s",
    begin: "-44.29s",
    radius: 4.1,
    satelliteClass: "satellite-two",
  },
  {
    id: "orbit-three",
    path: "M 500 -130 A 430 630 0 1 0 500 1130 A 430 630 0 1 0 500 -130",
    rotation: -36,
    duration: "137s",
    begin: "-104.12s",
    radius: 2.8,
    satelliteClass: "satellite-three",
  },
] as const;

type SceneStyle = CSSProperties & {
  "--moon-glow-opacity": string;
  "--moonlight-opacity": string;
  "--star-field-far-opacity": string;
  "--star-field-mid-opacity": string;
  "--stardust-opacity": string;
};

const INITIAL_SCENE_STYLE: SceneStyle = {
  "--moon-glow-opacity": "0.078",
  "--moonlight-opacity": "0.244",
  "--star-field-far-opacity": "0.425",
  "--star-field-mid-opacity": "0.583",
  "--stardust-opacity": "0.228",
};

export function getCycleFraction(elapsedMs: number): number {
  const cyclePosition =
    ((elapsedMs % LUNAR_CYCLE_DURATION_MS) + LUNAR_CYCLE_DURATION_MS) %
    LUNAR_CYCLE_DURATION_MS;
  return cyclePosition / LUNAR_CYCLE_DURATION_MS;
}

export function getPhaseFraction(elapsedMs: number): number {
  return (getCycleFraction(elapsedMs) + INITIAL_PHASE) % 1;
}

export function getShadowPath(phaseFraction: number): string {
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

export function getShadowTransform(phaseFraction: number): string | null {
  return phaseFraction > 0.5 ? "translate(100 0) scale(-1 1)" : null;
}

function getPhaseName(phaseFraction: number): string {
  if (phaseFraction === 0 || phaseFraction === 1) return "new";
  const frameTolerance = 1000 / 60 / LUNAR_CYCLE_DURATION_MS;
  if (phaseFraction < 0.25 - frameTolerance) return "waxing-crescent";
  if (phaseFraction < 0.25 + frameTolerance) return "first-quarter";
  if (phaseFraction < 0.5 - frameTolerance) return "waxing-gibbous";
  if (phaseFraction < 0.5 + frameTolerance) return "full";
  if (phaseFraction < 0.75 - frameTolerance) return "waning-gibbous";
  if (phaseFraction < 0.75 + frameTolerance) return "last-quarter";
  return "waning-crescent";
}

function getIllumination(phaseFraction: number): number {
  return (1 - Math.cos(2 * Math.PI * phaseFraction)) / 2;
}

export function LunarPhaseVisual() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const moonRef = useRef<HTMLSpanElement>(null);
  const orbitsRef = useRef<SVGSVGElement>(null);
  const shadowDirectionRef = useRef<SVGGElement>(null);
  const shadowPathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    const moon = moonRef.current;
    const orbits = orbitsRef.current;
    const direction = shadowDirectionRef.current;
    const shadow = shadowPathRef.current;
    if (!scene || !moon || !orbits || !direction || !shadow) return;

    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    let animationFrame: number | null = null;
    let cycleStart: number | null = null;

    const updatePhase = (phaseFraction: number) => {
      const illumination = getIllumination(phaseFraction);
      shadow.setAttribute("d", getShadowPath(phaseFraction));
      const transform = getShadowTransform(phaseFraction);
      if (transform) {
        direction.setAttribute("transform", transform);
      } else {
        direction.removeAttribute("transform");
      }

      moon.dataset.phase = getPhaseName(phaseFraction);
      moon.dataset.illumination = illumination.toFixed(3);
      moon.dataset.cyclePosition = phaseFraction.toFixed(3);
      scene.style.setProperty(
        "--moon-glow-opacity",
        (0.06 + illumination * 0.12).toFixed(3),
      );
      scene.style.setProperty(
        "--moonlight-opacity",
        (0.2 + illumination * 0.3).toFixed(3),
      );
      scene.style.setProperty(
        "--star-field-far-opacity",
        (0.34 + (1 - illumination) * 0.1).toFixed(3),
      );
      scene.style.setProperty(
        "--star-field-mid-opacity",
        (0.48 + (1 - illumination) * 0.12).toFixed(3),
      );
      scene.style.setProperty(
        "--stardust-opacity",
        (0.16 + (1 - illumination) * 0.08).toFixed(3),
      );
    };

    const animate = (timestamp: number) => {
      cycleStart ??= timestamp;
      updatePhase(getPhaseFraction(timestamp - cycleStart));
      animationFrame = window.requestAnimationFrame(animate);
    };

    const startAnimation = () => {
      cycleStart = null;
      animationFrame = window.requestAnimationFrame(animate);
    };

    const applyMotionPreference = () => {
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }

      if (motionPreference.matches) {
        if (typeof orbits.pauseAnimations === "function") {
          orbits.pauseAnimations();
        }
        updatePhase(REDUCED_MOTION_PHASE);
      } else {
        if (typeof orbits.unpauseAnimations === "function") {
          orbits.unpauseAnimations();
        }
        startAnimation();
      }
    };

    applyMotionPreference();
    motionPreference.addEventListener("change", applyMotionPreference);

    return () => {
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }
      motionPreference.removeEventListener("change", applyMotionPreference);
    };
  }, []);

  return (
    <div
      className="celestial-scene"
      ref={sceneRef}
      style={INITIAL_SCENE_STYLE}
      data-cycle-duration={LUNAR_CYCLE_DURATION_MS}
      data-initial-phase={INITIAL_PHASE}
    >
      <div className="star-field star-field-far" />
      <div className="nebula-layer nebula-far" />
      <div className="nebula-layer nebula-band" />
      <div className="stardust-layer stardust-far" />
      <div className="star-field star-field-mid" />
      <div className="nebula-layer nebula-mid" />
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
            <stop offset="35%" stopColor="#a7b5ff" stopOpacity="0.56" />
            <stop offset="62%" stopColor="#dce2ff" stopOpacity="0.82" />
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
        <svg
          ref={orbitsRef}
          className="celestial-orbits"
          viewBox="0 0 1000 1000"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            {ORBITING_BODIES.map((orbit) => (
              <path key={orbit.id} id={`${orbit.id}-path`} d={orbit.path} />
            ))}
          </defs>
          {ORBITING_BODIES.map((orbit) => (
            <g key={orbit.id} transform={`rotate(${orbit.rotation} 500 500)`}>
              <use href={`#${orbit.id}-path`} className="orbit-line" />
              <circle
                className={`orbiting-body ${orbit.satelliteClass}`}
                cx="0"
                cy="0"
                r={orbit.radius}
              >
                <animateMotion
                  dur={orbit.duration}
                  begin={orbit.begin}
                  repeatCount="indefinite"
                  calcMode="paced"
                >
                  <mpath href={`#${orbit.id}-path`} />
                </animateMotion>
              </circle>
            </g>
          ))}
        </svg>
        <span
          className="moon"
          ref={moonRef}
          data-phase="waxing-crescent"
          data-illumination={getIllumination(INITIAL_PHASE).toFixed(3)}
          data-cycle-position={INITIAL_PHASE.toFixed(3)}
          data-cycle-duration={LUNAR_CYCLE_DURATION_MS}
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
              <g
                className="planet-shadow-morph"
                transform={`rotate(${SHADOW_TILT_DEGREES} 50 50)`}
              >
                <g ref={shadowDirectionRef}>
                  <path
                    ref={shadowPathRef}
                    d={getShadowPath(INITIAL_PHASE)}
                    fill="url(#moon-shadow)"
                    opacity="0.94"
                    filter="url(#moon-terminator-soft)"
                  />
                </g>
              </g>
            </g>
          </svg>
        </span>
      </div>
      <div className="stardust-layer stardust-near" />
    </div>
  );
}

export function LunarPhaseScene() {
  return <LunarPhaseVisual />;
}
