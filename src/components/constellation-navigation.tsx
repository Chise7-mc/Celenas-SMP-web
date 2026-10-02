"use client";

import {
  useEffect,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { navigation } from "@/content/navigation";

const nodePositions = [
  { left: "4%", top: "56%" },
  { left: "23%", top: "18%" },
  { left: "43%", top: "66%" },
  { left: "62%", top: "27%" },
  { left: "81%", top: "70%" },
  { left: "97%", top: "39%" },
] as const;

export function ConstellationNavigation() {
  const [activeHref, setActiveHref] = useState<string | null>(null);

  useEffect(() => {
    const sections = navigation
      .map(({ href }) => document.getElementById(href.slice(1)))
      .filter((section): section is HTMLElement => section !== null);

    const updateFromHash = () => {
      const hash = window.location.hash;
      if (!hash) return;

      const section = document.querySelector<HTMLElement>(hash);
      if (section) {
        section.focus({ preventScroll: true });
        section.scrollIntoView({ block: "start" });
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSections = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (first, second) =>
              Math.abs(first.boundingClientRect.top) -
              Math.abs(second.boundingClientRect.top),
          );
        const sectionId = visibleSections[0]?.target.id;
        if (sectionId) {
          setActiveHref(`#${sectionId}`);
        }
      },
      { rootMargin: "-18% 0px -58% 0px", threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));
    window.addEventListener("popstate", updateFromHash);

    return () => {
      observer.disconnect();
      window.removeEventListener("popstate", updateFromHash);
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
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: "start" });
  }

  function activateOnSpace(event: KeyboardEvent<HTMLAnchorElement>) {
    if (event.key !== " ") return;
    event.preventDefault();
    event.currentTarget.click();
  }

  const activeIndex = navigation.findIndex(({ href }) => href === activeHref);

  return (
    <nav
      className="constellation-navigation shell"
      aria-label="Celenas セクションナビゲーション"
    >
      <p className="constellation-label">NAV / CONSTELLATION</p>
      <div className="constellation-map">
        <svg
          className="constellation-lines"
          viewBox="0 0 1000 180"
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          {nodePositions.slice(0, -1).map((point, index) => {
            const next = nodePositions[index + 1];
            if (!next) return null;
            const x1 = Number.parseFloat(point.left) * 10;
            const y1 = Number.parseFloat(point.top) * 1.8;
            const x2 = Number.parseFloat(next.left) * 10;
            const y2 = Number.parseFloat(next.top) * 1.8;
            return (
              <line
                key={`${index}-${index + 1}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                className={index < activeIndex ? "is-traversed" : undefined}
              />
            );
          })}
        </svg>
        {navigation.map((item, index) => (
          <a
            key={item.href}
            className="constellation-node"
            href={item.href}
            style={
              index === navigation.length - 1
                ? {
                    ...nodePositions[index],
                    width: "max-content",
                    transform: "translate(calc(-100% - 0.2rem), -50%)",
                  }
                : nodePositions[index]
            }
            aria-current={activeHref === item.href ? "location" : undefined}
            onClick={(event) => navigateToSection(event, item.href)}
            onKeyDown={activateOnSpace}
          >
            <span className="constellation-point" aria-hidden="true" />
            <span className="constellation-node-copy">
              <span className="constellation-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="constellation-name">{item.label}</span>
            </span>
          </a>
        ))}
      </div>
    </nav>
  );
}
