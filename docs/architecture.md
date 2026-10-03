# Frontend architecture

## Boundaries

Celenas Web v1 is a marketing landing page rendered by Next.js App Router.
It has no API routes, data collection, authentication or external runtime
requests; small client boundaries handle the mobile menu and lunar scene.
Internal anchors provide navigation without a custom library.

| Location                               | Responsibility                                            |
| -------------------------------------- | --------------------------------------------------------- |
| `src/app/layout.tsx`                   | Japanese language, metadata, global styles                |
| `src/app/page.tsx`                     | Semantic home-page composition                            |
| `src/app/icon.png`                     | Canonical Celenas logo used as the site icon              |
| `src/components/community-details.tsx` | Public Java edition, version and Discord entry details    |
| `src/components/glass-surface.tsx`     | Shared glass interaction surface                          |
| `src/components/lunar-phase-scene.tsx` | Client boundary for the Hero's 120-second SVG phase morph |
| `src/components/mobile-navigation.tsx` | Small client boundary for closing mobile navigation       |
| `src/config/site.ts`                   | Reviewed, public product configuration                    |
| `src/content/home.ts`                  | Editable editorial copy and typed gallery manifest import |
| `src/content/gallery.json`             | Single source of approved Gallery entries                 |
| `src/content/navigation.ts`            | Shared anchor navigation definitions                      |
| `src/lib/lunar-phase.ts`               | Pure UTC lunar phase approximation                        |
| `src/lib/asset-path.ts`                | Public asset paths for the optional Pages base path       |
| `docs/world-assets.md`                 | Gallery image intake and management commands              |
| `src/styles/tokens.css`                | Shared visual tokens                                      |
| `tests/`                               | Component behavior and lunar domain tests                 |
| `e2e/`                                 | Production page in Playwright                             |
| `scripts/next.mjs`                     | Portable Next.js entry point with telemetry disabled      |
| `.github/workflows/ci.yml`             | Pull request and main-branch quality gates                |
| `.github/workflows/pages.yml`          | Independent GitHub Pages static export and deployment     |

Server components are the default. Add a client boundary only for an implemented
interaction needing browser state or APIs. Do not introduce state stores,
animation engines, 3D libraries or data-query clients speculatively.

`src/content/home.ts` owns brand/editorial language and the six public community
rules. `src/content/gallery.json` is the single source of Gallery metadata and
is imported with the `GalleryImage` type. Confirmed public facts remain in
`src/config/site.ts`. Minecraft Java Edition 26.3 and the Discord invitation are
public; the server address is intentionally not part of the site data model.
When no images are registered, the Gallery renders its intentional pending
state. Registered screenshots appear in a client-side horizontal rail with
scroll snapping, a compact position/progress display and keyboard/arrow
navigation. The page retains a single horizontal scroll region. To add a
screen capture, put PNG/JPEG/WebP files in `gallery-inbox/` and run
`pnpm gallery:add`. The CLI optimizes them into `public/gallery/`, updates the
manifest and archives the original locally. `pnpm gallery:validate` checks the
manifest and all published image files before quality checks and deployment.

The glass surface is a small server component backed by shared CSS tokens.
Desktop navigation is server-rendered. Mobile navigation is a small client
boundary only to close the menu after selection, update the hash and focus its
destination. One small client scene updates the SVG terminator path directly on
a 120-second cycle from a waxing crescent, at most every 100ms and without React
state updates. On narrow or coarse-pointer devices it uses a 200ms interval;
ambient CSS effects are static while the lunar phase and three SVG orbit paths
remain animated. Its animation frame loop, SVG orbits and Hero CSS motion pause
when the Hero is offscreen, the document is hidden, or reduced motion is
requested. A fixed-seed nebula is baked into a transparent WebP and displayed
as one slowly drifting background layer; no procedural SVG filters run in the
page. Desktop keeps just the mid stardust and one small star twinkle moving,
while aurora and Journey layers change opacity without transform motion. The
Hero does not use date-based lunar data, an API or geolocation.

## GitHub Pages deployment

The public Project Site is
[`https://chise7-mc.github.io/Celenas-SMP-web/`](https://chise7-mc.github.io/Celenas-SMP-web/).
The separate `pages.yml` workflow runs only for pushes to `main` or manual
dispatch; pull requests continue to run the read-only quality workflow without
deploying. Only the Pages build sets `GITHUB_PAGES=true` and
`NEXT_PUBLIC_BASE_PATH=/Celenas-SMP-web`, enabling Next.js static export, the
project base path and unoptimized local images. `withBasePath` applies the same
prefix to local logo and future gallery image paths. The generated `out/` is
checked for the expected HTML, asset paths, icon and logo before it is uploaded
as the Pages artifact. Ordinary development, production builds and Playwright
continue to use Next.js defaults without a base path.

## Public configuration

`site.connection` contains the published Minecraft Java Edition version and
Discord URL. The server address is intentionally excluded and is never
published on the website. Update public facts only after confirmation, then
rebuild. No environment file or secret is necessary.

The configuration is trusted, reviewed source code, not a user input boundary.
`CommunityConnection` requires an HTTPS URL at compile time. If a CMS, API or
user input later feeds these values, add runtime validation at that boundary.
Do not put private service addresses or credentials in this public object.

## Dependencies and runtime

Use Node.js 24 and the package-manager version in `package.json`. Dependencies
are pinned and the pnpm lockfile is committed. The installed pnpm 11.25.0 is
retained for local/CI parity. Its one-day release-age protection is explicit;
do not bypass it casually to obtain a just-published version.

Next.js and React use compatible stable releases. ESLint 9 and TypeScript 6.0
are compatibility exceptions: the installed Next.js lint plugins do not yet
declare support for ESLint 10 or TypeScript 7. ESLint 9 is upstream-deprecated;
revisit this pin when the plugins support the maintained major. Never silence
peer errors to force an upgrade. `strictPeerDependencies` makes mismatches fail.

Only the native resolver's required install hook is allowed. Script commands do
not auto-install dependencies (`verifyDepsBeforeRun: false`); run an explicit
`pnpm install --frozen-lockfile` first. Dependencies and browser installation need
network access; the product does not use remote services.

Plain CSS serves the small initial UI. Tailwind may be added when it improves
implemented work. System fonts avoid build-time font downloads.

## Deferred decisions

The current v1 landing page intentionally leaves official domain information
and real Minecraft imagery pending. Its six baseline rules are public and may
be updated with community guidance. The canonical logo is already included and
used by the site. Lunar phase visuals are an approximation based on a mean
synodic month, not an astronomical ephemeris. Hosting and live server status
remain separate from the marketing experience.

References: [Next.js installation](https://nextjs.org/docs/app/getting-started/installation),
[pnpm supply-chain protection](https://pnpm.io/supply-chain-security).
