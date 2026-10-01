"use client";

import { useState } from "react";
import { navigation } from "@/content/navigation";

function NavigationLinks({
  onNavigate,
}: {
  onNavigate?: (href: (typeof navigation)[number]["href"]) => void;
}) {
  return navigation.map((item) => (
    <a key={item.href} href={item.href} onClick={() => onNavigate?.(item.href)}>
      {item.label}
    </a>
  ));
}

export function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);

  function navigateToSection(href: (typeof navigation)[number]["href"]) {
    setIsOpen(false);

    const target = document.getElementById(href.slice(1));
    if (!target) {
      return;
    }

    window.history.pushState(null, "", href);
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: "start" });
  }

  return (
    <div className="mobile-nav">
      <button
        type="button"
        className="mobile-nav-toggle"
        aria-expanded={isOpen}
        aria-controls="mobile-nav-panel"
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="mobile-menu-label">Menu</span>
        <span className="menu-icon" aria-hidden="true" />
      </button>
      <nav
        id="mobile-nav-panel"
        className="mobile-nav-panel glass-surface"
        aria-label="ページ内"
        hidden={!isOpen}
      >
        <NavigationLinks onNavigate={navigateToSection} />
      </nav>
    </div>
  );
}
