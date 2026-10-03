"use client";

import { useEffect, useRef } from "react";
import { withBasePath } from "@/lib/asset-path";

export const LUNAR_CYCLE_DURATION_MS = 120_000;
export const PHASE_UPDATE_INTERVAL_MS = 100;
export const MOBILE_PHASE_UPDATE_INTERVAL_MS = 200;
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

export function LunarPhaseBackground() {
  return (
    <div className="hero-space-background" aria-hidden="true">
      <div className="deep-space-backdrop" />
      <div className="star-field star-field-far" />
      <div className="stardust-layer stardust-far" />
      <div className="star-field star-field-mid" />
      <div
        className="deep-space-nebula-baked"
        style={{
          backgroundImage: `url("${withBasePath("/space/hero-nebula.webp")}")`,
        }}
        aria-hidden="true"
      />
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
            <stop offset="35%" stopColor="#a7b5ff" stopOpacity="0.4" />
            <stop offset="62%" stopColor="#dce2ff" stopOpacity="0.65" />
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
      <div className="stardust-layer stardust-near" />
    </div>
  );
}

export function LunarPhaseVisual() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const moonRef = useRef<HTMLSpanElement>(null);
  const orbitsRef = useRef<SVGSVGElement>(null);
  const shadowDirectionRef = useRef<SVGGElement>(null);
  const shadowPathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    const hero = scene?.closest<HTMLElement>(".hero");
    const moon = moonRef.current;
    const orbits = orbitsRef.current;
    const direction = shadowDirectionRef.current;
    const shadow = shadowPathRef.current;
    if (!scene || !hero || !moon || !orbits || !direction || !shadow) return;

    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const mobilePerformancePreference = window.matchMedia(
      "(max-width: 48rem), (pointer: coarse)",
    );
    let animationFrame: number | null = null;
    const cycleStart = performance.now();
    let lastPhaseUpdate = Number.NEGATIVE_INFINITY;
    let heroIsVisible = false;
    let reducedPhaseApplied = false;
    let motionActive: boolean | null = null;

    const setAttributeIfChanged = (
      element: Element,
      name: string,
      value: string,
    ) => {
      if (element.getAttribute(name) !== value) {
        element.setAttribute(name, value);
      }
    };

    const setDataIfChanged = (
      element: HTMLElement,
      name: string,
      value: string,
    ) => {
      if (element.dataset[name] !== value) element.dataset[name] = value;
    };

    const setHeroStyleIfChanged = (name: string, value: string) => {
      if (hero.style.getPropertyValue(name) !== value) {
        hero.style.setProperty(name, value);
      }
    };

    const updatePhase = (phaseFraction: number) => {
      const illumination = getIllumination(phaseFraction);
      setAttributeIfChanged(shadow, "d", getShadowPath(phaseFraction));
      const transform = getShadowTransform(phaseFraction);
      if (transform) {
        setAttributeIfChanged(direction, "transform", transform);
      } else if (direction.hasAttribute("transform")) {
        direction.removeAttribute("transform");
      }

      setDataIfChanged(moon, "phase", getPhaseName(phaseFraction));
      setDataIfChanged(moon, "illumination", illumination.toFixed(3));
      setDataIfChanged(moon, "cyclePosition", phaseFraction.toFixed(3));
      setHeroStyleIfChanged(
        "--moon-glow-opacity",
        (0.06 + illumination * 0.12).toFixed(3),
      );
      setHeroStyleIfChanged(
        "--moonlight-opacity",
        (0.2 + illumination * 0.3).toFixed(3),
      );
      setHeroStyleIfChanged(
        "--star-field-far-opacity",
        (0.34 + (1 - illumination) * 0.1).toFixed(3),
      );
      setHeroStyleIfChanged(
        "--star-field-mid-opacity",
        (0.48 + (1 - illumination) * 0.12).toFixed(3),
      );
      setHeroStyleIfChanged(
        "--stardust-opacity",
        (0.16 + (1 - illumination) * 0.08).toFixed(3),
      );
    };

    const animate = (timestamp: number) => {
      const updateInterval = mobilePerformancePreference.matches
        ? MOBILE_PHASE_UPDATE_INTERVAL_MS
        : PHASE_UPDATE_INTERVAL_MS;
      if (timestamp - lastPhaseUpdate >= updateInterval) {
        updatePhase(getPhaseFraction(timestamp - cycleStart));
        lastPhaseUpdate = timestamp;
      }
      animationFrame = window.requestAnimationFrame(animate);
    };

    const setMotionActive = (active: boolean) => {
      if (motionActive === active) return;
      motionActive = active;
      if (hero.dataset.motionActive !== String(active)) {
        hero.dataset.motionActive = String(active);
      }
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }

      if (!active) {
        if (typeof orbits.pauseAnimations === "function") {
          orbits.pauseAnimations();
        }
        return;
      }

      if (typeof orbits.unpauseAnimations === "function") {
        orbits.unpauseAnimations();
      }
      const now = performance.now();
      updatePhase(getPhaseFraction(now - cycleStart));
      lastPhaseUpdate = now;
      animationFrame = window.requestAnimationFrame(animate);
    };

    const updateMotionState = () => {
      if (motionPreference.matches) {
        setMotionActive(false);
        if (!reducedPhaseApplied) {
          updatePhase(REDUCED_MOTION_PHASE);
          reducedPhaseApplied = true;
        }
        return;
      }

      reducedPhaseApplied = false;
      setMotionActive(document.visibilityState === "visible" && heroIsVisible);
    };

    hero.dataset.motionActive = "false";
    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries.find(({ target }) => target === hero);
        if (entry) {
          heroIsVisible =
            entry.isIntersecting && entry.intersectionRatio >= 0.01;
          updateMotionState();
        }
      },
      { threshold: [0, 0.01] },
    );
    visibilityObserver.observe(hero);
    const updateForVisibility = () => updateMotionState();
    motionPreference.addEventListener("change", updateMotionState);
    document.addEventListener("visibilitychange", updateForVisibility);
    updateMotionState();

    return () => {
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }
      visibilityObserver.disconnect();
      motionPreference.removeEventListener("change", updateMotionState);
      document.removeEventListener("visibilitychange", updateForVisibility);
    };
  }, []);

  return (
    <div
      className="celestial-scene"
      ref={sceneRef}
      data-cycle-duration={LUNAR_CYCLE_DURATION_MS}
      data-initial-phase={INITIAL_PHASE}
    >
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
                href={withBasePath("/space/lunar-surface.webp")}
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
    </div>
  );
}

export function LunarPhaseScene() {
  return <LunarPhaseVisual />;
}
