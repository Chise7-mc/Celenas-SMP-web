"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { navigation } from "@/content/navigation";

const sections = [{ href: "#hero" }, ...navigation];
const markerPositions = [
  { x: 47, y: 8 },
  { x: 67, y: 24 },
  { x: 43, y: 40 },
  { x: 64, y: 56 },
  { x: 41, y: 72 },
  { x: 65, y: 84 },
  { x: 57, y: 94 },
] as const;

export function CelestialJourney() {
  const [activeStage, setActiveStage] = useState("hero");
  const [activeHref, setActiveHref] = useState<string | null>(null);

  useEffect(() => {
    const observedSections = sections
      .map(({ href }) => document.getElementById(href.slice(1)))
      .filter((section): section is HTMLElement => section !== null);

    const navigateFromHistory = () => {
      const hash = window.location.hash;
      if (!hash) {
        setActiveStage("hero");
        setActiveHref(null);
        return;
      }
      const section = document.getElementById(hash.slice(1));
      if (!section) return;
      setActiveStage(section.id);
      setActiveHref(section.id === "hero" ? null : "#" + section.id);
      section.focus({ preventScroll: true });
      section.scrollIntoView({ block: "start" });
    };

    const updateActiveSection = () => {
      const activeLine = window.innerHeight * 0.4;
      const isAtPageEnd =
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 2;
      const visibleSections = observedSections
        .map((section) => ({
          section,
          rect: section.getBoundingClientRect(),
        }))
        .filter(({ rect }) => rect.bottom > 0 && rect.top < window.innerHeight);
      const activeSection = isAtPageEnd
        ? observedSections.at(-1)
        : (visibleSections.find(
            ({ rect }) => rect.top <= activeLine && rect.bottom > activeLine,
          )?.section ??
          visibleSections.sort(
            (first, second) =>
              Math.abs(first.rect.top - activeLine) -
              Math.abs(second.rect.top - activeLine),
          )[0]?.section);

      if (!activeSection) return;
      setActiveStage(activeSection.id);
      setActiveHref(
        activeSection.id === "hero" ? null : "#" + activeSection.id,
      );
    };

    const observer = new IntersectionObserver(updateActiveSection, {
      rootMargin: "-35% 0px -35% 0px",
      threshold: 0,
    });

    observedSections.forEach((section) => observer.observe(section));
    window.addEventListener("scrollend", updateActiveSection);
    window.addEventListener("popstate", navigateFromHistory);
    window.addEventListener("hashchange", navigateFromHistory);
    navigateFromHistory();

    return () => {
      observer.disconnect();
      window.removeEventListener("scrollend", updateActiveSection);
      window.removeEventListener("popstate", navigateFromHistory);
      window.removeEventListener("hashchange", navigateFromHistory);
    };
  }, []);

  function navigateToSection(
    event: MouseEvent<HTMLAnchorElement>,
    href: (typeof navigation)[number]["href"],
  ) {
    const target = document.getElementById(href.slice(1));
    if (!target) return;

    event.preventDefault();
    window.history.pushState(null, "", href);
    setActiveStage(target.id);
    setActiveHref(href);
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: "start" });
  }

  const activeIndex = navigation.findIndex(({ href }) => href === activeHref);
  const heroMarker = markerPositions[0] ?? { x: 47, y: 8 };
  const marker =
    activeIndex >= 0
      ? (markerPositions[activeIndex + 1] ?? heroMarker)
      : heroMarker;

  return (
    <>
      <div
        className="celestial-journey-atmosphere"
        data-stage={activeStage}
        aria-hidden="true"
      >
        <span className="journey-starfield" />
        <span className="journey-horizon" />
      </div>
      <nav
        className="orbital-section-navigation"
        aria-label="ページ内セクション"
      >
        <svg
          className="orbital-section-path"
          viewBox="0 0 100 340"
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M67 82 C90 100 20 119 43 136 S88 170 64 190 S17 225 41 245 S87 270 65 286 S69 307 57 320" />
        </svg>
        <span
          className="orbital-active-satellite"
          aria-hidden="true"
          style={{ left: marker.x + "%", top: marker.y + "%" }}
        />
        {navigation.map((item, index) => (
          <a
            className="orbital-section-link"
            key={item.href}
            href={item.href}
            style={{
              left: (markerPositions[index + 1] ?? heroMarker).x + "%",
              top: (markerPositions[index + 1] ?? heroMarker).y + "%",
            }}
            aria-label={String(index + 1).padStart(2, "0") + " " + item.label}
            aria-current={activeHref === item.href ? "location" : undefined}
            onClick={(event) => navigateToSection(event, item.href)}
          >
            <span className="orbital-section-node" aria-hidden="true" />
            <span className="orbital-section-label" aria-hidden="true">
              <span>{String(index + 1).padStart(2, "0")}</span>
              {item.label}
            </span>
          </a>
        ))}
      </nav>
    </>
  );
}
