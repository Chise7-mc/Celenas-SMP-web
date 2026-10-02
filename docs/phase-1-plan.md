# Phase 1 implementation plan (historical)

This document records the original Phase 1 plan and implementation context.
Its time-specific notes below are historical and do not describe the current
repository configuration.

## Goal and design

Establish a reproducible frontend foundation for Celenas Web v1, with a
minimal accessible landing page and local/CI quality gates. The supplied
Phase 1 brief authorizes autonomous implementation, a feature branch,
cohesive commits and a pull request; merging remains out of scope.

Use Next.js App Router, React, strict TypeScript and CSS custom properties.
Server components own the initial page; a typed configuration object owns
unconfirmed public product information. Use native HTML before adding UI
libraries. Plain CSS is enough for this phase; Tailwind is optional later.

Alternative approaches considered: a generated starter adds sample assets and
unneeded defaults; a full design framework adds dependencies before there are
components to justify them. A manual, minimal Next.js bootstrap keeps ownership
and verification clear.

## Constraints and decisions

- Preserve existing work and use a dedicated `codex/` branch.
- No invented server address, Discord URL, version, metrics or domain.
- No runtime external services, remote fonts, analytics or telemetry.
- The canonical logo is absent; use text branding until it is supplied.
- Keep Phase 1 UI deliberately minimal; defer concept art and Liquid Glass.
- Use installed pnpm 11.25.0 for reproducibility and Node.js 24 for local/CI
  parity; resolve stable application and test packages from the registry.
- The root implements changes; an independent reviewer only reads files.
- Keep the execution record here instead of creating local agent-tool files.

## Tasks

- [ ] Foundation: package scripts, lockfile, strict TypeScript, ESLint,
      Prettier, Next.js layout and CSS tokens. Verify dependency install.
- [ ] Behavior: first add tests for unavailable connection information and
      configured information; observe failure, implement `CommunityDetails`,
      and verify tests. Compose the minimal home page around that component.
- [ ] Browser gates: production-server Playwright smoke checks on desktop and
      mobile, keyboard skip navigation, overflow, axe and reduced motion.
- [ ] Harness: concise AGENTS routing, architecture/design/testing/quality
      documentation, README and CI using the same commands as local work.
- [ ] Verify and review: run every gate, inspect browser rendering and Git
      changes, obtain a read-only independent review, resolve material issues.
- [ ] Deliver: cohesive commits, push feature branch, create PR, inspect CI.

## Review focus

1. Missing product configuration must never become a fake join action.
2. Configured HTTPS community links and server information must be usable.
3. Keyboard users must reach main content with visible focus.
4. Narrow screens and enlarged text must not create horizontal overflow.
5. CI must exercise a fresh production server rather than a stale dev server.

## Execution record

- Inspected clean `main`: only README and one initialization commit.
- Created `codex/phase-1-frontend-foundation`.
- Registry inspection confirmed stable Next.js 16.3.8, React 19.3.0 and
  Vitest 5.0.3 at implementation time.
