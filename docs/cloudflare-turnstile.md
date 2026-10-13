# Cloudflare Turnstile and Join API setup

The repository prepares a static Pages site, one Pages Function (`POST
/api/join`) and a separately deployed Durable Object Worker. No Cloudflare
resource, secret, DNS record or production deployment is created by this code
change. Until the dashboard setup and a real Preview test succeed, the Join
flow is intentionally unavailable and the static page contains no Discord
invite URL.

## Cloudflare resources

1. In **Turnstile**, create a managed widget for a Preview hostname and a
   separate Production widget for `celenas-smp.pages.dev`. Restrict each
   widget to its corresponding hostname. Keep both site keys and secrets in
   their respective environment settings; Preview credentials must not be
   reused in Production.
2. In **Workers & Pages**, deploy the prepared Worker from
   `cloudflare/rate-limiter` with Wrangler after reviewing its configuration.
   This creates the `JoinRateLimiter` SQLite Durable Object migration. Free
   Workers plans have finite daily request and Durable Object storage/compute
   quotas; traffic above those quotas is not free. The actor stores at most
   five request timestamps, keyed by an HMAC of `cf-connecting-ip`; an alarm
   deletes expired state after 60 seconds.
3. In the Pages project, add a `JOIN_RATE_LIMITER` Durable Object binding to
   class `JoinRateLimiter` from Worker `celenas-join-rate-limiter` for Preview
   and Production, then redeploy. Configure Pages' Functions quota behavior
   to **fail closed** so an exhausted free allowance cannot bypass API code.
4. Set these Pages environment values for both Preview and Production:

   | Name                             | Type           | Value                                                                  |
   | -------------------------------- | -------------- | ---------------------------------------------------------------------- |
   | `JOIN_ALLOWED_ORIGIN`            | variable       | Exact HTTPS origin of that environment, with no path or trailing slash |
   | `DISCORD_INVITE_URL`             | secret         | Approved `https://discord.gg/<invite-code>` destination                |
   | `TURNSTILE_SECRET_KEY`           | secret         | Secret for that environment's widget                                   |
   | `RATE_LIMIT_HMAC_SECRET`         | secret         | Random independent secret, at least 32 random bytes                    |
   | `JOIN_RATE_LIMITER`              | binding        | The deployed Durable Object namespace/class above                      |
   | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | build variable | Public site key for that environment's widget                          |

The site key is inlined into the static client bundle at build time. Add it
to the Pages build environment before building Preview, then rebuild after
changing it. Never put either secret in a `NEXT_PUBLIC_` variable, source
file or GitHub Actions variable exposed to pull requests.

### Rate-limiting options considered

- **WAF Rate Limiting:** Cloudflare documents rules at the zone level. The
  current official hostname is the shared `pages.dev` host, not a custom
  hostname in a zone controlled by this project. A rule cannot be assumed to
  protect this project host; adding a custom domain would require a domain and
  zone decision. Cloudflare documents one rate-limiting rule on its Free plan.
- **Workers Rate Limiting binding:** the binding is fast but deliberately
  approximate, eventually consistent and local to each Cloudflare location.
  Cloudflare's Pages Functions binding reference lists supported bindings but
  not this binding. A separate Worker plus a service binding would add another
  deployable service and still not provide a global counter.
- **Workers KV:** KV is eventually consistent and its ordinary read/modify/write
  sequence is not an atomic counter. It is not suitable for a strict per-source
  request limit.
- **Durable Objects (chosen):** SQLite-backed Durable Objects provide
  strongly consistent storage and are available on Workers Free. The Pages
  Function routes each HMAC-anonymized source to one actor. It enforces two
  requests per rolling 10 seconds and five per rolling 60 seconds, returns
  `429` with `Retry-After`, and removes timestamps after their 60-second
  lifetime. Free quotas are finite: current Cloudflare documentation lists
  100,000 Durable Object requests/day, 13,000 GB-s/day, 5 million row reads/day,
  100,000 row writes/day and 5 GB SQLite data. The Pages Function also shares
  the Workers Free 100,000 daily request quota. Exceeding a free quota causes
  operations to fail; it does not silently create a paid plan. The account
  owner should confirm current limits and billing settings before provisioning.

These checks throttle requests that reach the application; they do not replace
Cloudflare's network-level DDoS mitigation. Rate limits use the connecting IP
as a short-lived abuse-control key, not as account identity. People sharing a
NAT or mobile carrier network can share a counter.

The project already builds for the official root URL with
`DEPLOY_TARGET=cloudflare` and `NEXT_PUBLIC_SITE_URL` set to its confirmed
HTTPS origin. Preserve those build values. Pages Functions route configuration
limits invocation to `/api/join`; static browsing continues to use static
assets.

## Preview verification

1. Deploy a Preview using a Preview-specific widget and secrets and the
   Preview's exact `JOIN_ALLOWED_ORIGIN`.
2. Open the Preview, navigate to Join, start verification and complete the
   challenge. Confirm the API returns the Discord invite only after the
   challenge and that it opens in a new tab.
3. Check `GET`, `HEAD`, `OPTIONS`, invalid Origin, malformed/oversized JSON,
   invalid/expired/reused token, hostname mismatch and unavailable bindings.
   Confirm rejected responses have `Cache-Control: no-store`, API security
   headers and no credential/token in responses or logs.
4. Send more than two requests from the same source within 10 seconds and
   more than five within a minute. Confirm `429` and `Retry-After`; wait for
   expiry and verify legitimate retries work. Also test from a shared mobile
   network because per-IP controls may affect users sharing a NAT address.
5. Confirm normal page browsing does not load Turnstile or call `/api/join`,
   the production CSP allows only the needed Turnstile hostname, and the
   published HTML/JavaScript contains no Discord invite URL.

The local unit and browser tests cannot establish that Cloudflare Preview
bindings, real Turnstile hostnames, external Siteverify and the deployed
Durable Object all work together. Do not mark the security change production
ready until the Preview checks above pass.

References: [Turnstile free plan and hostnames](https://developers.cloudflare.com/turnstile/plans/),
[Turnstile CSP](https://developers.cloudflare.com/turnstile/reference/content-security-policy/),
[Pages Function bindings](https://developers.cloudflare.com/pages/functions/bindings/),
[Pages Function pricing](https://developers.cloudflare.com/pages/functions/pricing/),
[Workers Rate Limiting accuracy/locality](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/),
[Durable Objects pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/),
[WAF rate-limiting plans](https://developers.cloudflare.com/waf/),
[Pages custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/),
[KV consistency](https://developers.cloudflare.com/kv/concepts/how-kv-works/).

## Rollback

Revert the web change to restore the former static Join experience; this does
not change GitHub Pages hosting. To roll back Cloudflare settings, remove the
Pages Durable Object binding and revert its environment variables, then
redeploy the prior Pages deployment. Leave the GitHub Pages redirect workflow
enabled unless separately approved.
