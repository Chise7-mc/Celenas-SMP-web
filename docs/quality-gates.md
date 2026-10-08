# Quality gates

## Pull requests

The `quality` job in `.github/workflows/ci.yml` runs on pull requests and pushes
to `main`. It installs locked dependencies and Chromium, then runs `pnpm check`:
formatting, lint, strict types, unit tests, production build and browser tests.
The workflow has read-only permissions, no deployment, no secrets, no retained
checkout credentials and no artifact uploads. Actions use fixed commit SHAs.
Redundant runs for the same ref are cancelled.

The independent `.github/workflows/pages.yml` workflow deploys only pushes to
`main` (or an explicit manual dispatch). It builds Next.js Static Export with
the `/Celenas-SMP-web` Project Site base path and verifies the original `out/`.
Only after verification, it replaces `index.html` and `404.html` in the Pages
artifact with redirects to `https://celenas-smp.pages.dev/` and removes the old
sitemap. The Cloudflare build remains untouched. It does not run for pull
requests and does not change the normal `pnpm check` workflow.

Cloudflare Pages can build the same static export at the domain root with
`DEPLOY_TARGET=cloudflare` and a confirmed HTTPS origin in
`NEXT_PUBLIC_SITE_URL`. Run `pnpm build` followed by
`pnpm verify:cloudflare`. Do not configure the Cloudflare production URL until
the Pages project has been created and its actual public URL is known. The
GitHub Pages workflow remains enabled independently.

Use the same Node.js major, pnpm version and commands locally. CI uses Ubuntu;
Windows development is also supported. Configure branch protection to require
`quality` separately when repository policy is decided. A workflow alone does
not configure protection.

## Before handoff

1. Install with `pnpm install --frozen-lockfile`; ensure peer checks pass.
2. Run `pnpm check` and inspect the actual output.
3. Review the diff, tracked files and Git state. Exclude generated output,
   credentials, private data, logs and machine-specific paths.
4. Check desktop/narrow rendering, keyboard focus and reduced motion.
5. Check docs match implementation; disclose missing product data or branding.
6. Inspect CI for the exact PR commit. Report pending, failed or unavailable
   checks honestly. Never merge without explicit authorization.

## Before public release

Confirm server details, community links, official logo, imagery rights, content
and domain. Review dependency advisories and the documented lint compatibility
exception. Choose hosting and its security/privacy policy. Add browser coverage
and manual assistive-technology testing proportionate to the audience. Phase 1
does not authorize deployment or server polling.

Passing CI establishes a development foundation, not a finished public site.
