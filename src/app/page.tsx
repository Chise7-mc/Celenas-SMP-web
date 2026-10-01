import Image from "next/image";
import Link from "next/link";
import { CommunityDetails } from "@/components/community-details";
import { SectionHeading } from "@/components/section-heading";
import { site } from "@/config/site";

const navigation = [
  { href: "#about", label: "About" },
  { href: "#world", label: "World" },
  { href: "#community", label: "Community" },
  { href: "#rules", label: "Rules" },
  { href: "#gallery", label: "Gallery" },
  { href: "#join", label: "Join" },
];

const worldFeatures = [
  {
    title: "建築と探検",
    body: "静かな景観と、自然に溶け込む建築を楽しめるような空間づくりを目指します。",
  },
  {
    title: "共に過ごす時間",
    body: "協力プレイや雑談、イベントの準備にも、余白を持った落ち着いたコミュニティ性を大切にします。",
  },
  {
    title: "長く続く空気感",
    body: "急な競争よりも、同じ時間をゆっくり育てていく感覚を大切にするサーバーです。",
  },
];

const gallery = [
  { label: "Moonlit base", tone: "tone-1" },
  { label: "Campsite", tone: "tone-2" },
  { label: "Skyline", tone: "tone-3" },
  { label: "Community build", tone: "tone-4" },
];

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main">
        本文へ移動
      </a>
      <header className="site-header shell">
        <Link className="wordmark" href="/" aria-label="Celenas SMP ホーム">
          <Image
            src="/brand/celenas-logo-white.png"
            alt="Celenas"
            width={152}
            height={44}
            priority
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
      </header>
      <main id="main" tabIndex={-1} className="page-shell">
        <section className="hero shell" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">Moonlit survival community</p>
            <h1 id="hero-title">{site.name}</h1>
            <p className="hero-description">
              Minecraft で、静かなつながりを育てる場所。
            </p>
            <p className="muted">
              建築と会話、探検と時間の流れを大切にするコミュニティです。
            </p>
            <div className="hero-actions">
              <a className="primary-link" href="#join">
                参加案内を見る <span aria-hidden="true">↗</span>
              </a>
              <a className="secondary-link" href="#about">
                Celenas を知る
              </a>
            </div>
            <ul className="hero-meta" aria-label="Celenasの特徴">
              <li>
                <span className="status-dot" aria-hidden="true" />
                余白のある暮らし
              </li>
              <li>
                <span className="status-dot" aria-hidden="true" />
                建築と探検を楽しむ
              </li>
              <li>
                <span className="status-dot" aria-hidden="true" />
                参加方法は準備中
              </li>
            </ul>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="moon-scene" aria-hidden="true">
              <span className="moon" />
              <span className="orbit orbit-one" />
              <span className="orbit orbit-two" />
              <span className="orbit orbit-three" />
            </div>
            <div className="hero-panel panel-primary">
              <span className="panel-label">Current vibe</span>
              <strong>Calm, social, and slow-build</strong>
            </div>
            <div className="hero-panel panel-secondary">
              <span className="panel-label">Status</span>
              <strong>Details pending</strong>
            </div>
          </div>
        </section>

        <section
          id="about"
          className="shell content-section"
          aria-labelledby="about-title"
        >
          <SectionHeading
            eyebrow="About"
            title="Celenas をどう感じるか。"
            description="静かな夜空のように、プレイヤーごとに安心して過ごせる時間を大切にするコミュニティです。"
          />
          <div className="split-layout">
            <div>
              <p>
                Celenas
                は、ただのサーバーではなく、同じ時間を少しだけ静かに楽しめる居場所を目指します。
              </p>
              <p>
                建築を長く続けること、会話を大切にすること、仲間と安心して過ごすことを中心に、過度な競争より「居心地の良さ」を重視しています。
              </p>
            </div>
            <ul className="check-list" aria-label="Celenasの価値観">
              <li>夜空のように落ち着いた雰囲気</li>
              <li>協力と建築を尊重する文化</li>
              <li>新しい参加者にも温かな導入</li>
            </ul>
          </div>
        </section>

        <section
          id="world"
          className="shell content-section"
          aria-labelledby="world-title"
        >
          <SectionHeading
            eyebrow="World"
            title="暮らしの輪郭を育てる空間"
            description="ワールドの表現は将来の写真や建築紹介に差し替えられるよう、余白を持って設計しています。"
          />
          <div className="feature-grid">
            {worldFeatures.map((feature) => (
              <article key={feature.title} className="feature-card">
                <div className="feature-art" aria-hidden="true" />
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="community"
          className="shell content-section"
          aria-labelledby="community-title"
        >
          <SectionHeading
            eyebrow="Server / Community"
            title="参加に必要な情報は、確認できる時に載せます。"
            description="未確定の値はそのまま未公開として扱い、誤った情報を作り出しません。"
          />
          <div className="community-layout">
            <div className="community-panel">
              <p className="panel-label">Welcome</p>
              <p>
                接続先や参加方法は、確認でき次第このページで案内します。今は公開前の状態を保ち、誤情報を避けています。
              </p>
            </div>
            <div className="soft-panel">
              <p className="panel-label">Status</p>
              <p>
                参加条件や接続先は、管理者が確定した時点で更新します。今は詳細を公開前の状態に保ちます。
              </p>
            </div>
          </div>
        </section>

        <section
          id="rules"
          className="shell content-section"
          aria-labelledby="rules-title"
        >
          <SectionHeading
            eyebrow="Rules"
            title="サーバールールは管理者確認中です。"
            description="公開準備が整い次第、こちらで正式な案内を更新します。"
          />
          <div className="soft-panel" aria-live="polite">
            <p>
              サーバールールは現在、管理者確認中です。
              公開準備が整い次第、このページで案内します。
            </p>
          </div>
        </section>

        <section
          id="gallery"
          className="shell content-section"
          aria-labelledby="gallery-title"
        >
          <SectionHeading
            eyebrow="Gallery"
            title="今は形を持たない空気感を、将来の写真で育てます。"
            description="スクリーンショットが揃うまでは、レイアウトとキャプションの構造だけを完成させます。"
          />
          <div className="gallery-grid" aria-label="将来のサムネイルギャラリー">
            {gallery.map((item) => (
              <figure key={item.label} className={`gallery-tile ${item.tone}`}>
                <div className="gallery-visual" aria-hidden="true" />
                <figcaption>{item.label}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section
          id="join"
          className="join-section shell"
          aria-labelledby="join-title"
        >
          <div>
            <p className="eyebrow">Join</p>
            <h2 id="join-title">参加案内</h2>
            <p className="muted">
              参加の案内は、準備が整い次第こちらで更新します。今は安心して待てる環境を整えています。
            </p>
          </div>
          <div className="cta-panel">
            <CommunityDetails connection={site.connection} />
          </div>
        </section>
      </main>
      <footer className="site-footer shell">
        <p>{site.name}</p>
        <p>Minecraft コミュニティ</p>
      </footer>
    </>
  );
}
