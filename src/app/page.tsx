import Image from "next/image";
import Link from "next/link";
import { CommunityDetails } from "@/components/community-details";
import { GlassSurface } from "@/components/glass-surface";
import { MobileNavigation } from "@/components/mobile-navigation";
import { SectionHeading } from "@/components/section-heading";
import { site } from "@/config/site";
import { homeContent } from "@/content/home";
import { navigation } from "@/content/navigation";

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
              src="/brand/celenas-logo-white.png"
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
      <main id="main" tabIndex={-1} className="page-shell">
        <section
          className="hero shell"
          aria-labelledby="hero-title"
          id="hero"
          tabIndex={-1}
        >
          <div className="hero-copy">
            <p className="eyebrow">{homeContent.hero.eyebrow}</p>
            <div className="hero-brand">
              <Image
                src="/brand/celenas-logo-white.png"
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
              <a className="glass-button glass-button-primary" href="#join">
                {homeContent.hero.primaryAction}
                <span aria-hidden="true">↗</span>
              </a>
              <a className="glass-button glass-button-secondary" href="#about">
                {homeContent.hero.secondaryAction}
              </a>
            </div>
            <p className="hero-note">
              <span className="status-indicator" aria-hidden="true" />
              参加方法は準備中
            </p>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="star-field star-field-far" />
            <div className="star-field star-field-mid" />
            <div className="star-accents">
              <span className="star-twinkle star-twinkle-one" />
              <span className="star-twinkle star-twinkle-two" />
              <span className="star-twinkle star-twinkle-three" />
              <span className="star-steady star-steady-one" />
              <span className="star-steady star-steady-two" />
            </div>
            <div className="celestial-stage">
              <span className="moon" />
              <span className="orbit orbit-one" />
              <span className="orbit orbit-two" />
              <span className="orbit orbit-three" />
              <span className="orbit-light" />
            </div>
            <GlassSurface className="hero-glass-note">
              <span className="panel-label">Celenas</span>
              <strong>A quieter kind of world</strong>
            </GlassSurface>
          </div>
          <a className="scroll-cue" href="#about">
            Discover <span aria-hidden="true">↓</span>
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
            eyebrow="Server / Community"
            title={homeContent.community.title}
            description={homeContent.community.description}
          />
          <div className="community-layout">
            <GlassSurface className="community-panel">
              <p className="panel-label">Connection details</p>
              <CommunityDetails connection={site.connection} />
            </GlassSurface>
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
          <GlassSurface className="pending-panel">
            <span className="pending-mark" aria-hidden="true">
              <span />
            </span>
            <p>{homeContent.rules.pending}</p>
          </GlassSurface>
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
            <div className="gallery-grid">
              {homeContent.gallery.images.map((image) => (
                <figure key={image.src} className="gallery-item">
                  <div className="gallery-image">
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      sizes="(max-width: 48rem) 100vw, (max-width: 72rem) 50vw, 36rem"
                    />
                  </div>
                  <figcaption>
                    <span>{image.caption}</span>
                    {image.location ? <span>{image.location}</span> : null}
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <GlassSurface className="gallery-empty">
              <div className="gallery-orbit" aria-hidden="true">
                <span />
                <span />
              </div>
              <div>
                <p className="panel-label">Field notes / 00</p>
                <h3>{homeContent.gallery.pending}</h3>
                <p>
                  実際の風景が届いたら、ここから Celenas の記録をお届けします。
                </p>
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
          </div>
          <GlassSurface className="join-panel">
            <CommunityDetails connection={site.connection} />
          </GlassSurface>
        </section>
      </main>
      <footer className="site-footer shell">
        <Link href="/" aria-label="Celenas SMP ホーム">
          Celenas SMP
        </Link>
        <p>Minecraft community / Moonlit moments, made together.</p>
      </footer>
    </>
  );
}
