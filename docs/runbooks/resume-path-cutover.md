# Cutover: home.patrickkearney.dev → patrickkearney.dev/resume

A one-time checklist for moving the resume to its new path in production. The code side is in the repo (see [ADR 0003](../decisions/0003-sections-on-paths.md)). These are the Cloudflare dashboard steps around the deploy. `home.patrickkearney.dev` is retired without a redirect.

> **Verify before you start.** These points come from how Cloudflare usually behaves and weren't checked against the current docs when this was written. Confirm them in the [Workers routing docs](https://developers.cloudflare.com/workers/configuration/routing/):
>
> 1. A Custom Domain on a hostname takes precedence over routes (or blocks them), so the hub has to move from a Custom Domain to a route before `/resume` routes on the apex can work.
> 2. A route on a hostname with no origin needs a proxied DNS record, for example `AAAA @ 100::`.
> 3. With the default `html_handling` (`auto-trailing-slash`), `/resume` redirects to `/resume/`, and `resume/index.html` is served there.

## 1. Move the hub from a Custom Domain to a route

Do this before merging `develop` into `main`. Expect a brief blip on `patrickkearney.dev`.

- [ ] **Workers & Pages → patrickkearney-hub → Settings → Domains & Routes:** remove the Custom Domain `patrickkearney.dev`.
- [ ] **DNS:** if removing the Custom Domain also deleted the apex record, add `AAAA`, name `@`, content `100::`, **Proxied**.
- [ ] **Back on the hub Worker:** add the route `patrickkearney.dev/*` for the zone `patrickkearney.dev`. `hub/wrangler.jsonc` declares the same route, so the next deploy keeps it.
- [ ] Check that `https://patrickkearney.dev/` still shows the hub.

## 2. Deploy

- [ ] Open a PR from `develop` into `main` and merge it. Cloudflare builds and deploys both Workers, and the resume Worker should pick up its `/resume` routes from `wrangler.jsonc`.
- [ ] **Workers & Pages → resume-site → Settings → Domains & Routes:** check that the routes `patrickkearney.dev/resume` and `patrickkearney.dev/resume/*` are listed. In the real cutover the deploy didn't create them, so add them here if they're missing. Without them, `/resume/` shows the hub's "Page not found".
- [ ] Check that `https://patrickkearney.dev/resume/` loads with styles, the headshot and the PDF link.
- [ ] Check that `https://patrickkearney.dev/resume` (no slash) ends up at the page.
- [ ] Check that `https://patrickkearney.dev/robots.txt` and `/sitemap.xml` come from the hub and list `/resume/`.

## 3. Retire the old subdomain

- [ ] **Workers & Pages → resume-site → Settings → Domains & Routes:** remove the Custom Domain `home.patrickkearney.dev`. Until then it serves a 404, because the files now live under `/resume/`.
- [ ] **DNS:** if a `home` record is left behind, delete it.

## 4. Optional

- [ ] Update the site link on LinkedIn and GitHub.
- [ ] Submit `https://patrickkearney.dev/sitemap.xml` in Search Console.

## Rolling back

1. Revert the merge on `main`. Cloudflare redeploys the old build, which serves from the root again.
2. Re-attach `home.patrickkearney.dev` as a Custom Domain on resume-site.
3. The hub can stay on its route; it works the same as with a Custom Domain.
