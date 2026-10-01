# Design-system foundation

## Direction and scope

Celenas uses a restrained night-sky palette, generous white space and clear
typography. The visual language emphasizes a premium dark / moonlight mood,
with subtle orbit and glass-like interaction layers rather than a generic game
server template. Minecraft screenshots remain content, not the dominant UI
language.

The current implementation delivers the public Web v1 landing experience:
Hero / About / World / Server / Rules pending state / Gallery / Join / Footer.
The canonical logo is the official white asset at
`public/brand/celenas-logo-white.png`, already used in the site header and hero.
The site remains intentionally modest about unverified server/community data and
keeps confirmed values separate from pending placeholders.

The Hero pairs the official mark with a separate date-driven SVG moon and CSS
orbit illustration. Moon shape, glow and star-field strength respond subtly to
the calculated lunar illumination. The illustration is decorative, not a
substitute logo or a representation of the actual Minecraft world. World
themes are editorial aspirations; the Gallery stays in a polished pending
state until approved screenshots exist.

## Tokens and components

`src/styles/tokens.css` is the source of truth. The palette includes deep
night backgrounds, moonlit surfaces, subtle accent tones and accessible
focus contrast. Use semantic tokens instead of duplicating color literals.
Control radius, spacing, readable width and type scale live here too.

Glass tokens cover fallback and translucent surfaces, border/highlight, shadow,
blur, saturation and motion. `.glass-surface` provides an opaque background
fallback and applies restrained blur only where supported. Use the shared
`GlassSurface` component for substantial interactive or pending surfaces; do
not turn every section into a card.

Use system sans-serif for copy and monospace only for connection addresses.
The page uses a floating desktop glass header and an accessible expandable
mobile menu. The Hero combines a large official mark with a separate SVG/CSS
celestial scene: deterministic far/mid star layers, a few asynchronously
twinkling accents, three deterministic radial-gradient stardust depth layers, a
locally calculated lunar phase, slowly drifting moonlight and differently paced
orbit rings. Stardust opacity responds subtly to continuous lunar illumination;
its layers drift with transforms rather than animating individual particles or
background positions. Motion is intentionally low-key and is disabled when the
user requests reduced motion, while the static phase shape, atmosphere and dust
remain visible. Small client boundaries support mobile menu behavior and
refreshing the lunar phase; no animation or astronomy dependency is needed. The
calculation is an approximation; see [lunar phase](lunar-phase.md).

## Interaction and accessibility

- Preserve one descriptive `h1`, logical headings and named navigation.
- Use links for navigation, buttons for actions and native HTML where possible.
- Keep the first keyboard stop a visible-on-focus skip link to focusable `main`.
- Keep a visible focus outline and sufficient text/control contrast.
- Interactive targets have at least 44 CSS pixels of height.
- At narrow widths, stack content and wrap long strings. Test enlarged text.
- Respect `prefers-reduced-motion`; motion cannot be required to understand content.
- Future blur/transparency must have an opaque fallback and preserve contrast.
- Keep non-critical world images lazy and provide descriptive alt text when
  administrator-approved screenshots are added.
- Keep internal asset guidance in `docs/world-assets.md`, not under `public/`.

Automated axe results are evidence, not proof of complete accessibility. Before
release, manually inspect focus order, zoom, screen-reader output and real
device behavior. No third-party font or image request is needed for the current
landing page.
