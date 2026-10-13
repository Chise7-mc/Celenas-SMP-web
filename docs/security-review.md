# Dependency security review

Reviewed 2026-10-13 with pnpm 11.25.0.

- `pnpm audit --prod`: no known vulnerabilities.
- `pnpm audit`: one known High development-only transitive advisory for
  `braces@3.0.3`, reached through `eslint-config-next >
@next/eslint-plugin-next > fast-glob > micromatch > braces`.
- GitHub advisory [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
  currently lists no patched version. Production dependencies do not include
  this path. Recheck the advisory and dependency tree before release rather
  than forcing an unreviewed override.

This review does not cover Cloudflare account configuration or live Preview
behavior. See [Turnstile and Join API setup](cloudflare-turnstile.md).
