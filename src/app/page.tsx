import Image from "next/image";
import Link from "next/link";
import { CelestialJourney } from "@/components/celestial-journey";
import { GlassSurface } from "@/components/glass-surface";
import { GalleryRail } from "@/components/gallery-rail";
import {
  LunarPhaseBackground,
  LunarPhaseScene,
} from "@/components/lunar-phase-scene";
import { MobileNavigation } from "@/components/mobile-navigation";
import { SectionHeading } from "@/components/section-heading";
import { TransmissionPanel } from "@/components/transmission-panel";
import { site } from "@/config/site";
import { homeContent } from "@/content/home";
import { navigation } from "@/content/navigation";
import { withBasePath } from "@/lib/asset-path";

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main">
        本文へ移動
      </a>
      <header className="site-header shell">
        <div className="header-bar glass-surface">
          <Link className="brand-link" href="/" aria-label="Celenas SMP ホーム">
            <Image
              src={withBasePath("/brand/celenas-logo-white.png")}
              alt=""
              width={48}
              height={48}
              loading="eager"
              className="brand-logo"
            />
          </Link>
          <nav className="top-nav" aria-label="メインナビゲーション">
            {navigation.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>
          <MobileNavigation />
        </div>
      </header>
      <CelestialJourney />
      <main id="main" tabIndex={-1} className="page-shell">
        <section
          className="hero shell"
          aria-labelledby="hero-title"
          id="hero"
          tabIndex={-1}
        >
          <LunarPhaseBackground />
          <div className="hero-copy">
            <p className="eyebrow">{homeContent.hero.eyebrow}</p>
            <div className="hero-brand">
              <Image
                src={withBasePath("/brand/celenas-logo-white.png")}
                alt=""
                width={176}
                height={176}
                loading="eager"
                className="hero-logo"
              />
              <h1 id="hero-title">{site.name}</h1>
            </div>
            <p className="hero-description">{homeContent.hero.description}</p>
            <p className="hero-supporting">{homeContent.hero.supportingText}</p>
            <div className="hero-actions">
              <a
                className="glass-button glass-button-primary"
                href={site.connection.discordUrl}
                target="_blank"
                rel="noreferrer"
              >
                {homeContent.hero.primaryAction}
                <span aria-hidden="true">↗</span>
              </a>
              <a className="glass-button glass-button-secondary" href="#about">
                {homeContent.hero.secondaryAction}
              </a>
            </div>
            <p className="hero-note">
              <span className="status-indicator" aria-hidden="true" />
              Minecraft Java Edition 26.3
            </p>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <LunarPhaseScene />
          </div>
          <a className="scroll-cue" href="#about">
            About Celenas <span aria-hidden="true">↓</span>
          </a>
        </section>

        <section
          id="about"
          className="shell content-section about-section"
          aria-labelledby="about-title"
          tabIndex={-1}
        >
          <SectionHeading
            id="about-title"
            eyebrow="About"
            title={homeContent.about.title}
            description={homeContent.about.description}
          />
          <div className="about-signature">
            <Image
              src={withBasePath("/brand/celenas-logo-white.png")}
              alt=""
              width={64}
              height={64}
            />
            <span>
              <strong>Celenas SMP</strong>
              <small>Minecraft Java 26.3 · Survival SMP</small>
            </span>
          </div>
          <div className="split-layout">
            <div className="about-copy">
              {homeContent.about.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <ul className="value-list" aria-label="Celenasが大切にしたいこと">
              {homeContent.about.values.map((value, index) => (
                <li key={value}>
                  <span aria-hidden="true">0{index + 1}</span>
                  {value}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          id="world"
          className="shell content-section world-section"
          aria-labelledby="world-title"
          tabIndex={-1}
        >
          <SectionHeading
            id="world-title"
            eyebrow="World"
            title={homeContent.world.title}
            description={homeContent.world.description}
          />
          <ol className="world-themes">
            {homeContent.world.themes.map((theme) => (
              <li key={theme.number}>
                <span className="theme-number">{theme.number}</span>
                <h3>{theme.title}</h3>
                <p>{theme.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section
          id="community"
          className="shell content-section community-section"
          aria-labelledby="community-title"
          tabIndex={-1}
        >
          <SectionHeading
            id="community-title"
            eyebrow="Community / Connection"
            title={homeContent.community.title}
            description={homeContent.community.description}
          />
          <div className="community-layout">
            <TransmissionPanel
              connection={site.connection}
              variant="community"
            />
            <GlassSurface className="community-note">
              <span className="status-indicator" aria-hidden="true" />
              <p>{homeContent.community.note}</p>
            </GlassSurface>
          </div>
        </section>

        <section
          id="rules"
          className="shell content-section rules-section"
          aria-labelledby="rules-title"
          tabIndex={-1}
        >
          <SectionHeading
            id="rules-title"
            eyebrow="Rules"
            title={homeContent.rules.title}
            description={homeContent.rules.description}
          />
          <ol className="rules-list">
            {homeContent.rules.items.map((rule) => (
              <li key={rule.number}>
                <span className="rule-number">{rule.number}</span>
                <div>
                  <h3>{rule.title}</h3>
                  <p>{rule.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="rules-footnote">{homeContent.rules.footnote}</p>
        </section>

        <section
          id="gallery"
          className="shell content-section gallery-section"
          aria-labelledby="gallery-title"
          tabIndex={-1}
        >
          <SectionHeading
            id="gallery-title"
            eyebrow="Gallery"
            title={homeContent.gallery.title}
            description={homeContent.gallery.description}
          />
          {homeContent.gallery.images.length > 0 ? (
            <GalleryRail images={homeContent.gallery.images} />
          ) : (
            <GlassSurface className="gallery-empty">
              <div className="gallery-orbit" aria-hidden="true">
                <span />
                <span />
              </div>
              <div>
                <p className="panel-label">ARCHIVE / 00</p>
                <h3>{homeContent.gallery.pending}</h3>
                <p>{homeContent.gallery.emptyDescription}</p>
              </div>
            </GlassSurface>
          )}
        </section>

        <section
          id="join"
          className="join-section shell"
          aria-labelledby="join-title"
          tabIndex={-1}
        >
          <div className="join-copy">
            <p className="eyebrow">Join</p>
            <h2 id="join-title">{homeContent.join.title}</h2>
            <p className="muted">{homeContent.join.description}</p>
            <ol className="join-steps" aria-label="参加までの手順">
              {homeContent.join.steps.map((step) => (
                <li key={step.number}>
                  <span aria-hidden="true">{step.number}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <TransmissionPanel connection={site.connection} variant="join" />
        </section>
      </main>
      <footer className="site-footer shell">
        <Link href="/" aria-label="Celenas SMP ホーム">
          Celenas SMP
        </Link>
        <p>Celenas SMP · Minecraft Java 26.3</p>
      </footer>
    </>
  );
}
