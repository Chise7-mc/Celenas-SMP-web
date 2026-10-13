# Cloudflare Phase 3A: Preview build remediation

This runbook records the confirmed failures for PR #2, the completed Preview
setup, and the remaining release gates. Commands and future configuration
steps below are plans, not authorization to change Production.

## Confirmed build results

- Pages project `celenas-smp`, deployment
  `0420b5f8-5030-408d-a61e-c1ec6b638f49`: build failed because
  `NEXT_PUBLIC_SITE_URL` was absent. The Pages log also reports Node.js
  `24.13.1`; Corepack requires `24.15.0` or newer.
- Workers Builds project `celenas-smp`, build
  `ef17047f-3aa1-4c08-a483-6b897d4c698f`: Next.js completed, then the
  separate Worker preview command `npx wrangler preview` failed because the
  selected Worker configuration has no `previews` block.

These are separate Cloudflare projects/build paths. The repository's only
checked-in Wrangler configuration is
`cloudflare/rate-limiter/wrangler.jsonc`; it is not a repository-root config
for the `celenas-smp` Worker Builds project. Do not change that Worker to
`wrangler deploy`, point it at the rate-limiter directory, or infer its role
from the shared project label.

## Pages Preview settings

First inspect the existing Pages settings without editing them:

1. Open **Workers & Pages > `celenas-smp` (Pages) > Settings > Builds &
   deployments**. Record the framework preset, root directory, build command,
   output directory, build image, and Preview environment variable names.
2. Expected values for this repository are root `/`, build command
   `pnpm build`, and output directory `out`. The static export is configured
   by `DEPLOY_TARGET=cloudflare`; it must remain set once, not duplicated.
3. For the Preview environment only, add the build variable
   `NEXT_PUBLIC_SITE_URL=https://celenas-smp.pages.dev/`. This is the confirmed
   canonical site URL used in static metadata. It is not the Preview request
   origin checked by the API.
4. Pin the build image to Node `24.19.0` and pnpm `11.25.0` using the Pages
   build variables `NODE_VERSION` and `PNPM_VERSION`, if those values are not
   already controlled by the repository's version files/package manager.
   The repository now pins `.node-version` to `24.19.0` as well.

The first Preview rebuild creates a deployment URL. Use the exact host from
that deployment for the next configuration; do not guess a branch/commit
alias.

After obtaining the Preview URL:

1. Create a Turnstile widget restricted to that exact Preview hostname. The
   hostname field takes a hostname only (no scheme, path, or wildcard).
2. Set the Pages **Preview** build variable `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
   to that widget's public Site Key, then rebuild so the key is included in
   the static bundle.
3. In Pages **Preview** Variables and Secrets, set
   `JOIN_ALLOWED_ORIGIN` to the exact Preview origin (scheme and hostname,
   without a trailing slash). Keep it distinct from
   `NEXT_PUBLIC_SITE_URL=https://celenas-smp.pages.dev/`.
4. Add the Preview widget's `TURNSTILE_SECRET_KEY`, a random
   `RATE_LIMIT_HMAC_SECRET` of at least 32 bytes, and a dedicated test-only
   `DISCORD_INVITE_URL`. Do not reuse Production credentials or invite.
5. Set `JOIN_RATE_LIMITER` in the Pages **Preview** environment to a
   Preview-only Durable Object namespace. Keep the Production environment's
   binding separate. The Function returns unavailable when any required
   binding or secret is missing.

Pages settings are under **Settings > Environment variables** for build
values and **Settings > Variables and Secrets** for Function runtime values
and bindings. Dashboard labels may differ slightly as Cloudflare updates the
UI. Preview and Production settings are configured independently.

## Existing Workers Builds project `celenas-smp`

Read-only inspect **Workers & Pages > `celenas-smp` (Worker) > Settings >
Builds** and record:

- its purpose and production branch;
- root directory and build command;
- production deploy command and non-production Preview command;
- Preview branch trigger and Worker Previews settings;
- the Wrangler configuration selected by that root.

The dashboard was read without changing settings on 2026-10-13:

- This is a separate Worker project, linked to `Chise7-mc/Celenas-SMP-web`.
- Production branch: `main`; root: `/`; build: `pnpm build`.
- The current Production deploy-command field displays `cloudflare`. An older
  failed main-branch build used `npx wrangler deploy`. These are observations
  of different revisions of the configuration, not a proposed replacement.
- Preview branch builds are enabled; command: `npx wrangler preview`; root: `/`.
  Preview URLs are disabled. No build variables or secrets are configured.
- The Overview shows no enabled URLs, custom domains, routes, bindings, or
  bound consumer Workers; it reports zero invocations for the last 24 hours.
- A manually deployed Worker version exists. Recent Git builds failed without
  creating a new Worker version. The working Pages website is independent.

The checked-in rate-limiter config belongs to a different Worker. Adding its
`previews` block cannot fix a command running from the repository root. The
observed configuration does not serve the official Pages site or supply its
rate limiter. The owner's intended future purpose still needs confirmation.
If it is a legacy duplicate and Pages is the intended site host, the
non-production branch build trigger can be disabled while preserving the
existing production Worker, its deployment, and its production branch. Do not
delete the Worker or disconnect its production integration.

If this Worker is still required, add a correct Wrangler configuration for
that Worker's actual source root and configure Worker Previews, including
Preview-specific bindings/secrets. Keep the Preview command as
`npx wrangler preview`. Do not point it at `cloudflare/rate-limiter`; that is
a different Worker.

## Rate-limiter Worker and Durable Object isolation

The Production Worker configuration names `celenas-join-rate-limiter`; its
class is `JoinRateLimiter` and SQLite migration remains `v1`. Wrangler 4.149.0
dry-run accepts the config and reports `JOIN_LIMITER`. This does not create or
deploy the Production Worker.

The Wrangler config now repeats `JOIN_LIMITER` under `previews`, as required
for Worker Previews that use an environment binding. Cloudflare creates
separate Durable Object namespaces/storage for Worker Previews. That does
not by itself prove that a Pages Function binding can select a dynamically
created Worker Preview namespace. Verify the supported target in the Pages
binding UI/API before testing. If it cannot target that namespace, deploy a
dedicated `celenas-join-rate-limiter-preview` Worker with its own DO namespace
and bind only the Pages Preview environment to it. Never bind Pages Preview
to the Production namespace.

A dedicated `celenas-join-rate-limiter-preview` Worker and its own SQLite DO
namespace have been deployed with administrator authorization. Only Pages
Preview has the `JOIN_RATE_LIMITER` binding. Production currently has no DO
binding or join Secrets. Do not reuse the Preview Worker, namespace, HMAC
secret, Turnstile widget, or test Discord invite in Production.

## Preview evidence and limits

The verified branch alias is
`https://codex-turnstile-security.celenas-smp.pages.dev`.
Deployment `6d530167-d02c-4357-a685-a3dee70a4c72` successfully deployed commit
`776b43f238eb3f9125b117094c9f7645c63680da` in Preview. Recheck the deployment
commit after any subsequent PR push; earlier runtime results do not certify
an untested deployment.

- Explicit `wrangler pages secret list --project-name celenas-smp --env preview`
  confirms `DISCORD_INVITE_URL`, `TURNSTILE_SECRET_KEY`, and
  `RATE_LIMIT_HMAC_SECRET`. The Production secret list is empty. Record names
  and existence only; never export values, HAR files, request payloads, or
  invitation-bearing response bodies.
- The managed Preview widget allows only the verified branch hostname. The
  configured public key matches the built bundle; `JOIN_ALLOWED_ORIGIN` matches
  the exact branch origin.
- Normal Chrome displayed the successful join state and opened the Discord
  invitation screen. The administrator subsequently verified HTTP 200 and
  `Cache-Control: no-store` in Chrome Network. This Network observation was
  reported by the administrator, not captured by the browser automation API.
- Real Preview requests rejected invalid tokens with 403 `verification_failed`,
  another Origin with 403, GET with 405, and non-JSON content with 415. Rejected
  responses contained no invitation and used `no-store`.
- Preview measured the third request in 10 seconds and sixth attempt
  in 60 seconds returning 429 with `Retry-After`. After the wait, an invalid
  token reached verification again and returned 403 rather than 429. A later
  normal Chrome challenge succeeded after those windows had elapsed.
- Mobile browsing returned HTTP 200 with no horizontal overflow, no observed
  CSP violations, and no join API invocation. CSP, HSTS, nosniff, and referrer
  policy headers were present. Static HTML contained no invitation.
- Network replay of the successful POST is pending administrator confirmation.
  A 429 is not evidence of Siteverify rejecting reuse; require 403
  `verification_failed` after the limiter permits the request.
- Expiry of an unused real token has **not** been measured. Instrumented Chrome
  failed before token issuance with challenge error `600010`; normal Chrome
  succeeded. Do not change browser fingerprints or ask the user to paste code
  into Console. Existing local tests mock Siteverify's `timeout-or-duplicate`
  response and verify rejection; they do not prove Cloudflare token expiry.
  Cloudflare specifies a 300-second lifetime and single use. Replaying a used
  token after five minutes proves neither unused-token expiry nor its cause.

Reference: [Cloudflare server-side validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).

## Shared Fail closed assessment

Both Pages environments currently report `fail_open=true`. The dashboard/API
setting is shared; do not change it without separate administrator approval.
PR #2 exports `_routes.json` with `include: ["/api/join"]` and no wildcard or
middleware. Normal static requests therefore do not invoke Functions.

On Workers Free, Pages Functions share the daily Workers request quota.
Cloudflare documents Fail open as serving static assets when the allowance is
exhausted; Fail closed returns an error instead on Function invocation routes.
Static requests outside those routes are free and unlimited. The application's
own dependency failures return no invitation, but that is separate from this
platform quota policy. Do not exhaust a shared account quota to test it.

The current successful Production deployment is
`3c88d8d7-3264-4eb3-8010-8b020d2e38be`, commit
`b3ec5279c03215ab62a2f7f0937fbd5664f5abfc`. That commit has neither `functions/`
nor `_routes.json`. Read-only HTTP checks returned 200 for its home page and
404 HTML for `/api/join` and `/_routes.json`. This supports a low current static
site risk, not an empirical test of exhausted-quota behavior.

Proposed approved-change sequence:

1. Re-read the canonical Production deployment and its invocation routes;
   abort if they differ from the assessed static deployment.
2. Record both environments' existing `fail_open` values and the current
   Production deployment. In Pages **Settings > Runtime > Fail open/closed**,
   choose Fail closed once; preserve all variables, Secrets, and bindings.
3. Read back `false` for both environments. Check Production `/` and static
   assets, Preview normal browsing, and real Preview join success/rejection.
4. If ordinary browsing regresses, restore Fail open through the same control
   and verify the recorded `true` values. Record the security tradeoff; changing
   this setting does not fix exhausted quota or provide a working join API.

No Fail closed change or quota-exhaustion experiment has been performed.

References: [routing and Fail open/closed](https://developers.cloudflare.com/pages/functions/routing/),
[Pages Functions pricing](https://developers.cloudflare.com/pages/functions/pricing/).

## Production preparation gate

Production remains **NO_GO** while required real Preview tests or release
configuration are incomplete. Prepare independent resources only after the
Preview acceptance decision and explicit approval for Production changes.
Workers Free is the approved plan; stop if any operation requires a paid plan.
Cloudflare supports SQLite Durable Objects on Free; usage above the Free
allowance must cause refusal, not a plan upgrade. Preserve disabled
observability and do not enable paid services as part of this preparation.

| Item             | Production plan                                                                                              | Current state                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| Turnstile        | New managed widget restricted to `celenas-smp.pages.dev`                                                     | Not created                                              |
| Public build key | New widget's `NEXT_PUBLIC_TURNSTILE_SITE_KEY`                                                                | Absent                                                   |
| Turnstile Secret | New widget's `TURNSTILE_SECRET_KEY`, entered privately                                                       | Absent                                                   |
| Discord invite   | Operator-provided `DISCORD_INVITE_URL` Secret                                                                | Absent                                                   |
| HMAC             | Independently generated secret of at least 32 bytes                                                          | Absent                                                   |
| Rate limiter     | `celenas-join-rate-limiter`, `JoinRateLimiter`, SQLite `v1`                                                  | Config dry-run only                                      |
| Pages DO binding | Production `JOIN_RATE_LIMITER` to the new Production namespace                                               | Absent                                                   |
| Origin           | `JOIN_ALLOWED_ORIGIN=https://celenas-smp.pages.dev`                                                          | Absent                                                   |
| Build            | `/`, `pnpm build`, `out`, `DEPLOY_TARGET=cloudflare`, confirmed site URL; Node 24.19.0 / pnpm 11.25.0 parity | Existing build settings; version parity recheck required |
| Platform policy  | Approved shared Fail closed change                                                                           | Pending approval                                         |

After approval, prepare the isolated Worker/binding and private Secrets before
switching the site artifact. Supply the public widget key before its build.
Keep the existing successful deployment available until all prerequisites and
CI are accepted. PR merge and Production deployment require final approval.

## Rollback

The Wrangler `previews` block does not deploy a resource. Reverting its commit
restores the previous configuration. For Preview rollback, redeploy the last
verified Preview commit with its matching widget/build configuration and retain
the independent Preview namespace. Pages' Production rollback control is not
a Preview rollback mechanism.

Before any future Production rollout, retain the successful Production
deployment above, its commit, build configuration, shared fail policy, and
binding metadata; privately retain recoverable Production Secret inputs.
Use the Pages rollback control to select the recorded successful Production
deployment if a rollout fails, then verify `/`, assets, and the legacy GitHub
Pages redirect. Restore shared fail policy or bindings separately if changed:
an artifact rollback must not be assumed to restore project-level settings.
The old website has a static invitation, so restoring it also restores the
previous access policy. No rollback or Production change was performed here.

Reference: [Cloudflare Pages rollbacks](https://developers.cloudflare.com/pages/configuration/rollbacks/).

## Local review and checks

The three-file handoff pins Node to `24.19.0`, supplies the rate-limiter's
Worker Preview binding block, and records this runbook. It changes no frontend
or API implementation. Node `24.19.0` and pnpm `11.25.0` were used locally.

- `pnpm install --frozen-lockfile`: success, lockfile unchanged.
- `pnpm check`: success; formatting, lint, types, gallery validation,
  66 unit tests, production build, and 51 browser tests passed (5 skipped).
- `DEPLOY_TARGET=cloudflare NEXT_PUBLIC_SITE_URL=https://celenas-smp.pages.dev/`
  with `pnpm build` and `pnpm verify:cloudflare`: success; root export,
  security headers, `/api/join` invocation routing, and 18 assets verified.
- Wrangler 4.149.0 `deploy --dry-run --config cloudflare/rate-limiter/wrangler.jsonc`:
  success, no deployment. The configured SQLite `v1` migration is retained.

These local checks are not a substitute for the unmeasured real-token expiry
test or post-push Preview and CI verification.

Reference: [Durable Objects pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/).
