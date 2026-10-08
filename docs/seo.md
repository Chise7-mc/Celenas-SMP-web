# Search indexing and GitHub Pages

The public site is a GitHub Pages Project Site at
`https://chise7-mc.github.io/Celenas-SMP-web/`. Its sitemap is published at
`https://chise7-mc.github.io/Celenas-SMP-web/sitemap.xml` and contains only the
canonical home page.

This repository cannot publish the host-level robots file at
`https://chise7-mc.github.io/robots.txt`. A file in this project would be served
inside the repository path, while crawlers look for `robots.txt` at the host
root; a subpath file does not control that host-level scope. The root file must
be managed by the GitHub Pages host or the owner of the `chise7-mc.github.io`
site. This project therefore does not add a misleading subpath `robots.txt`.
The page metadata explicitly allows indexing and following links.

References: [GitHub Pages Project Site URL structure](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages),
[Google robots.txt scope and location](https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec).
