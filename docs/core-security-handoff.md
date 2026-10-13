# Celenas Core application security handoff

This is a planning handoff only. The Core source was not available in the Web
worktree, and no Discord bot or server-side behavior is changed here. Implement
and verify this work on the official Core host/repository after its owner
confirms the live architecture and current application flow.

## Required protections

- Require the expected Wick-verified member role before accepting an
  application. Fetch current Discord member/role state at decision time; do not
  trust role names supplied by the applicant or website.
- Enforce one active application per Discord user, using the immutable
  Discord user ID as the unique key. Do not key identity by display name or
  Minecraft username.
- Apply a per-user cooldown and a broader abuse limit. Persist cooldown state
  across process restarts and define an expiry/retention policy.
- Make duplicate detection, cooldown consumption and application creation
  atomic. A unique database constraint or transaction must prevent concurrent
  duplicate submissions.
- Preserve the existing review, approval, whitelist and applicant-notice
  workflow. Add checks around those transitions rather than replacing them.
- Make retries idempotent so Discord delivery or process retries cannot create
  a second application, whitelist action or conflicting notice.
- Keep audit data minimal. Never persist the website Turnstile token or invite
  URL in application records or logs.

## Suggested verification

Cover missing/removed Wick role, duplicate pending application, cooldown
expiry, concurrent duplicate requests, restart persistence, moderator review,
approval/whitelist and notice retry behavior. Test against a staging Discord
guild and non-production database before release. Confirm privacy/retention,
backup and rollback plans with the Core operator before production changes.

The website Turnstile is only a public-web bot check. It is not Discord identity
verification, Wick verification, authorization, or a substitute for these Core
controls.
