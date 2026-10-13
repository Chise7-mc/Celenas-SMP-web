# Search indexing and legacy hosting

The official site is Cloudflare Pages at
`https://celenas-smp.pages.dev/`. `src/app/sitemap.ts` publishes the single
canonical home page. `src/app/robots.ts` allows public pages to be crawled and
points crawlers to the canonical sitemap.

The Google Search Console verification file is present at
`public/google148fc1719efa7f1d.html`. Its public availability does not confirm
that the property is still verified in the Search Console account.

The legacy GitHub Pages Project Site at
`https://chise7-mc.github.io/Celenas-SMP-web/` remains deployed. Its workflow
preserves the redirect page to the Cloudflare site. The live legacy URL currently
responds with a page-level immediate redirect and `noindex, follow` metadata,
not an HTTP 301/308 response. The workflow also removes the legacy sitemap from
the redirect artifact. Keep the workflow enabled until old links and search
results no longer need that entry point; stopping it would remove the redirect.

The GitHub Pages Project Site cannot control the host-level
`https://chise7-mc.github.io/robots.txt` file. A `robots.txt` in this repository
is scoped to the project path on GitHub Pages. Cloudflare Pages serves the
project's root-level `robots.txt` at the official domain.
