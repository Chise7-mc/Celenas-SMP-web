# Testing

## Setup and commands

Use Node.js 24 and pnpm 11.25.0. Install with `pnpm install --frozen-lockfile`.
Install Chromium once with `pnpm exec playwright install chromium` (Linux CI uses
`--with-deps`). If a Windows shell cannot resolve the pnpm-exec shim, use
`.\node_modules\.bin\playwright.cmd install chromium`.

| Command             | Evidence                                                 |
| ------------------- | -------------------------------------------------------- |
| `pnpm format:check` | Formatting consistency                                   |
| `pnpm lint`         | Next.js, React and TypeScript lint; warnings fail        |
| `pnpm typecheck`    | Next route types and strict TypeScript, including tests  |
| `pnpm test`         | Component behavior with Vitest and React Testing Library |
| `pnpm test:watch`   | Focused local feedback                                   |
| `pnpm build`        | Production compilation and static generation             |
| `pnpm test:e2e`     | Fresh production server, desktop/mobile Chromium         |
| `pnpm check`        | All gates, ending in production browser checks           |

Run `pnpm build` before standalone `pnpm test:e2e`; `pnpm check` does this for
you. Playwright starts its own server on loopback port 3100 and refuses to reuse
an existing listener. Free that port instead of changing reuse behavior.

## Coverage

Component tests verify unavailable information has no fabricated join action and
configured values produce readable details and a usable HTTPS link. Fixtures
use reserved `.test` domains; those are never production defaults.

Browser tests load the production page, follow the participation anchor, check
missing information, keyboard skip navigation, runtime errors, narrow layout at
200% text size, reduced motion and axe WCAG A/AA rules. Desktop and mobile
projects both use Chromium; this is not Safari or Firefox coverage.

Prefer role/name queries and visible outcomes over implementation details or
broad snapshots. Test public behavior at the smallest useful layer. Use browser
tests for App Router integration and asynchronous server components.

## Privacy and limits

Traces, screenshots, video and remote artifact upload are off by default. Capture
synthetic/local content intentionally when diagnosing a defect. Generated test
metadata stays ignored. Never capture real player/server data or secrets.

Manual visual, keyboard, screen-reader and eventual cross-browser checks
complement automation. An axe pass is not a certification. On failure, identify
the cause, fix the relevant layer and rerun the affected check. Avoid blind retries.
