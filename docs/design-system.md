# Design-system foundation

## Direction and scope

Celenas uses a restrained night-sky palette, generous white space and clear
typography. The visual language emphasizes a premium dark / moonlight mood,
with subtle orbit and glass-like interaction layers rather than a generic game
server template. Minecraft screenshots remain content, not the dominant UI
language.

The current implementation delivers the public landing experience:
Hero / About / World / Community / Rules / Gallery / Join / Footer.
The canonical logo is the official white asset at
`public/brand/celenas-logo-white.png`, already used in the site header and hero.
Minecraft Java Edition 26.3 and Discord are confirmed public information. The
server address is intentionally not published. Gallery screenshots are shown
in a horizontal, image-only rail with native scroll snapping, a shared-height
stage, rounded borderless images and a keyboard-accessible fullscreen viewer.
The viewer keeps its counter and compact controls anchored to the viewport,
shows a brief reduced-motion-aware image fade, and leaves screenshots uncropped.

The Hero pairs the official mark with a fictional gas giant, a soft-edged SVG
phase mask, and three enlarged SVG ellipse paths with one satellite each. The
satellites follow their matching ellipse at distinct 72-, 103-, and 137-second
periods. A local SVG path morphs the planetary shadow through a 120-second
cycle from waxing crescent, with a fixed 12-degree tilt and no texture motion.
An irregular blue-indigo nebula and a soft gas-like atmosphere add depth
behind the planet while keeping the copy side dark. The page uses black, white,
and one periwinkle accent.
The planet's restrained amber cloud bands stay within the illustration. The
scene is decorative, not a substitute logo or a representation of the actual
Minecraft world. World themes describe the intended play style; the six concise
Rules establish shared expectations. The Gallery keeps screenshots prominent
without visible titles or location labels; descriptive alt text remains for
assistive technology.

## Tokens and components

`src/styles/tokens.css` is the source of truth. The palette uses a black canvas,
white text, grayscale surfaces, and one periwinkle accent with accessible focus
contrast. Use semantic tokens instead of duplicating color literals.
Control radius, spacing, readable width and type scale live here too.

Glass tokens cover fallback and translucent surfaces, border/highlight, shadow,
blur, saturation and motion. `.glass-surface` provides an opaque background
fallback and applies restrained blur only where supported. Use the shared
`GlassSurface` component for substantial interactive or pending surfaces; do
not turn every section into a card.

Use system sans-serif for copy and monospace for compact status and index labels.
The page uses a floating desktop glass header and an accessible expandable
mobile menu. The Hero combines a large official mark with a fictional gas
giant: a banded cloud texture masked by fixed-tilt SVG terminator geometry,
deterministic, non-tiled far/mid star layers, one localized star cluster, two
softly twinkling white stars, three sparse deterministic radial-gradient
stardust depth layers, and a black-blue deep-space WebP with a translucent blue
nebula and unevenly distributed stars. The refined 1600 × 1600 WebP is about
170 KB, with clearer nebula filaments and star detail;
controlled CSS stars add modest density without uniform sparkle. It drifts very
slowly; only two white stars twinkle subtly. A lightweight black gradient fades
the background at its left, right and lower edges while preserving the center.
Three layered
blue-indigo radial-gradient gas clouds drift gently on desktop using transforms
and opacity, without blur filters. Mobile keeps the background and planet but
stops ambient motion; lunar phase updates and three satellites remain. Journey
layers change opacity without transform motion. Hero motion pauses when the
Hero is offscreen or the document is hidden.
Stardust opacity responds subtly to the animated phase;
its layers drift with transforms rather than animating individual particles or
background positions. Motion is intentionally low-key and is disabled when the
user requests reduced motion, while a static waxing-crescent shape, atmosphere
and dust remain visible. The client boundary updates one SVG shadow path at
most every 100ms on desktop and 200ms on mobile without React state updates. No
animation library is needed; see
[lunar phase](lunar-phase.md).

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
