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

The Hero pairs the official mark with a fictional gas giant, a soft-edged SVG
phase mask, and three enlarged SVG ellipse paths with one satellite each. The
satellites follow their matching ellipse at distinct 72-, 103-, and 137-second
periods. A local SVG path morphs the planetary shadow through a 120-second
cycle from waxing crescent, with a fixed 12-degree tilt and no texture motion.
An irregular blue-indigo nebula and a restrained periwinkle aurora add depth
behind the planet while keeping the copy side dark. The page uses black, white,
and one periwinkle accent.
The planet's restrained amber cloud bands stay within the illustration. The
scene is decorative, not a substitute logo or a representation of the actual
Minecraft world. World themes are editorial
aspirations; the Gallery stays in a polished pending state until approved
screenshots exist.

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

Use system sans-serif for copy and monospace only for connection addresses.
The page uses a floating desktop glass header and an accessible expandable
mobile menu. The Hero combines a large official mark with a fictional gas
giant: a banded cloud texture masked by fixed-tilt SVG terminator geometry,
deterministic, non-tiled far/mid star layers, a few asynchronously twinkling
white stars, three deterministic radial-gradient stardust depth layers, and a
procedural SVG nebula. Fixed-seed low-frequency fractal noise, displacement and
bounded blur give the main blue-indigo cloud irregular edges and internal
variation; surrounding gas uses simple blur and two dark dust lanes interrupt
the cloud. Far stardust is static; the other layers drift slowly on desktop.
Mobile uses a low-cost static rendering mode for ambient layers, Journey
background movement, glass blur and procedural SVG filters; it preserves the
nebula paths and gradients, planet, 200ms lunar phase updates and three animated
satellites. Desktop retains its restrained moving aurora with static color,
three fixed SVG paths with white orbiting satellites, and slowly morphing
planetary shadow. Hero motion pauses when it is offscreen or the document is
hidden.
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
