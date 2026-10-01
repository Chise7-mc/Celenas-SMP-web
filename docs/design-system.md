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

## Tokens and components

`src/styles/tokens.css` is the source of truth. The palette includes deep
night backgrounds, moonlit surfaces, subtle accent tones and accessible
focus contrast. Use semantic tokens instead of duplicating color literals.
Control radius, spacing, readable width and type scale live here too.

Use system sans-serif for copy and monospace only for connection addresses.
The page keeps a quiet header, a typographic hero, accessible community detail
cards and a compact footer. Decorative celestial motion is allowed, but it must
not become required for understanding the content.

## Interaction and accessibility

- Preserve one descriptive `h1`, logical headings and named navigation.
- Use links for navigation, buttons for actions and native HTML where possible.
- Keep the first keyboard stop a visible-on-focus skip link to focusable `main`.
- Keep a visible focus outline and sufficient text/control contrast.
- Interactive targets have at least 44 CSS pixels of height.
- At narrow widths, stack content and wrap long strings. Test enlarged text.
- Respect `prefers-reduced-motion`; motion cannot be required to understand content.
- Future blur/transparency must have an opaque fallback and preserve contrast.

Automated axe results are evidence, not proof of complete accessibility. Before
release, manually inspect focus order, zoom, screen-reader output and real
device behavior. No third-party font or image request is needed for the current
landing page.
