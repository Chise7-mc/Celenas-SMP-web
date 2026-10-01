# Frontend architecture

## Boundaries

Celenas Web v1 is a marketing landing page rendered by Next.js App Router.
It has no API routes, data collection, authentication or external runtime
requests; the only client state controls the mobile navigation menu. Internal
anchors provide navigation without a custom library.

| Location                               | Responsibility                                       |
| -------------------------------------- | ---------------------------------------------------- |
| `src/app/layout.tsx`                   | Japanese language, metadata, global styles           |
| `src/app/page.tsx`                     | Semantic home-page composition                       |
| `src/components/community-details.tsx` | Configured / unavailable participation details       |
| `src/components/glass-surface.tsx`     | Shared glass interaction surface                     |
| `src/components/mobile-navigation.tsx` | Small client boundary for closing mobile navigation  |
| `src/config/site.ts`                   | Reviewed, public product configuration               |
| `src/content/home.ts`                  | Editable editorial copy and approved gallery entries |
| `src/content/navigation.ts`            | Shared anchor navigation definitions                 |
| `docs/world-assets.md`                 | Approved world screenshot asset convention           |
| `src/styles/tokens.css`                | Shared visual tokens                                 |
| `tests/`                               | Component behavior in jsdom                          |
| `e2e/`                                 | Production page in Playwright                        |
| `scripts/next.mjs`                     | Portable Next.js entry point with telemetry disabled |

Server components are the default. Add a client boundary only for an implemented
interaction needing browser state or APIs. Do not introduce state stores,
animation engines, 3D libraries or data-query clients speculatively.

`src/content/home.ts` owns brand/editorial language and typed gallery metadata.
Operational facts remain in `src/config/site.ts`; unknown connection fields stay
`null`. The gallery starts empty and renders an intentional pending state. To add
approved screenshots, place optimized files in `public/world/` and add their
public path, meaningful alt text and approved caption to the gallery content.
This is a lightweight source model, not a CMS or a source of live server data.

The glass surface is a small server component backed by shared CSS tokens.
Desktop navigation is server-rendered. Mobile navigation is a small client
boundary only to close the menu after selection, update the hash and focus its
destination. Hero and interaction motion are CSS-only.

## Public configuration

`site.connection` holds the server address, Minecraft version and Discord URL.
Unknown values are `null`; the page displays an honest unavailable state and
does not create dead links. Update only with confirmed public values, then
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

The current v1 landing page intentionally leaves real server/community facts,
administrator-approved rules, official domain information and real Minecraft
imagery as pending values. The canonical logo is already included and used by
the site. Hosting and live server status remain separate from the marketing
experience.

References: [Next.js installation](https://nextjs.org/docs/app/getting-started/installation),
[pnpm supply-chain protection](https://pnpm.io/supply-chain-security).
