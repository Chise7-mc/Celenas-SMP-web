# Celenas development agreements

Build a maintainable Minecraft community frontend. Keep changes small and
reviewable; do not invent product facts or replace the canonical logo.

## Read only what the task needs

- Architecture or dependencies: [architecture](docs/architecture.md).
- UI, styling or motion: [design system](docs/design-system.md).
- Test behavior or strategy: [testing](docs/testing.md).
- CI, release or handoff: [quality gates](docs/quality-gates.md).

## Stable boundaries

- Inspect the branch, working tree and relevant code before editing.
- Preserve unrelated work. Branches, commits, pushes, PRs and merges require
  authorization; a task may explicitly authorize them. Never merge by default.
- Use strict TypeScript, semantic HTML and server components by default.
- Keep confirmed public product data in `src/config/site.ts`; unknown values
  stay `null`. Never add credentials or private identifiers to public config.
- No unrequested network integrations, telemetry, analytics or remote fonts.
- Use CSS tokens; respect keyboard access, contrast and reduced motion.
- Add dependencies only for implemented requirements. Preserve the lockfile.
- Never commit generated output, local tool files, caches, logs or secrets.
- Do not collect player identifiers, addresses, chat, inventory or server data.
- New file writes or user-controlled paths require containment and relevant tests.

## Execution and verification

Inspect → plan → implement → verify → review → complete. Run safe local
checks autonomously. On failure, diagnose before changing code; after three
equivalent failures, change the hypothesis rather than blindly retrying.

Use `pnpm check` for the complete gate; see testing docs for focused commands.
Test changed public behavior, then run lint, types, tests and production build.
Keep independent subagent tasks read-only; the root owns implementation.

Before handoff inspect the diff and Git state. Report files changed, commands
and results, build outcome, deferred work, risks and a commit message (or actual
commits when authorized). Never claim unrun verification passed.
