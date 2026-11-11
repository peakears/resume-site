# Cutover: home.patrickkearney.dev → patrickkearney.dev/resume

A one-time checklist for moving the resume to its new path in production. The code side is in the repo (see [ADR 0003](../decisions/0003-sections-on-paths.md)). These are the Cloudflare dashboard steps around the deploy, in an order that keeps downtime to a few seconds.

> **Verify before you start.** These points come from how Cloudflare usually behaves and weren't checked against the current docs when this was written. Confirm each one in the [Workers routing docs](https://developers.cloudflare.com/workers/configuration/routing/):
>
> 1. A Custom Domain on a hostname takes precedence over routes (or blocks them), so the hub has to move from a Custom Domain to a route before `/resume` routes on the apex can work.
> 2. A route on a hostname with no origin needs a proxied DNS record, for example `AAAA @ 100::`.
> 3. With the default `html_handling` (`auto-trailing-slash`), `/resume` redirects to `/resume/`, and `resume/index.html` is served there.
> 4. Redirect Rules run before Workers, on routes and Custom Domains alike.
> 5. `wrangler deploy` applies the `routes` in `wrangler.jsonc`. Check whether it removes Custom Domains that were added in the dashboard but aren't in the config.

## 0. Before you start

- [ ] The PR is merged into `develop` and CI is green.
- [ ] You're not merging `develop` into `main` yet. Step 2 does that.
- [ ] Prepare a Redirect Rule in **Rules → Redirect Rules** for the zone, but leave it **disabled**:
  - **When:** `http.host eq "home.patrickkearney.dev"`
  - **Then:** dynamic redirect to `concat("https://patrickkearney.dev/resume", http.request.uri.path)`, status **301**, **preserve query string** on.
  - Examples: `home.…/` goes to `/resume/`, and `home.…/resume.pdf` goes to `/resume/resume.pdf`.

## 1. Move the hub from a Custom Domain to a route

Expect a brief blip on `patrickkearney.dev` during this step.

- [ ] **Workers & Pages → patrickkearney-hub → Settings → Domains & Routes:** remove the Custom Domain `patrickkearney.dev`.
- [ ] **DNS:** if removing the Custom Domain also deleted the apex record, add `AAAA`, name `@`, content `100::`, **Proxied**.
- [ ] **Back on the hub Worker:** add the route `patrickkearney.dev/*` for the zone `patrickkearney.dev`. `hub/wrangler.jsonc` declares the same route, so the next deploy keeps it.
- [ ] Check that `https://patrickkearney.dev/` still shows the hub.

## 2. Deploy

- [ ] Open a PR from `develop` into `main` and merge it. Cloudflare builds and deploys both Workers, and the resume Worker picks up its `/resume` routes from `wrangler.jsonc`.
- [ ] Check that `https://patrickkearney.dev/resume/` loads with styles, the headshot and the PDF link.
- [ ] Check that `https://patrickkearney.dev/resume` (no slash) ends up at the page.
- [ ] Check that `https://patrickkearney.dev/robots.txt` and `/sitemap.xml` come from the hub and list `/resume/`.

From this point until step 3, `home.patrickkearney.dev/` shows a 404, because the files now live under `/resume/`. Go straight on.

## 3. Redirect the old subdomain

- [ ] **Enable** the Redirect Rule from step 0.
- [ ] **Workers & Pages → resume-site → Settings → Domains & Routes:** remove the Custom Domain `home.patrickkearney.dev`. If the redirect already works while the Custom Domain is attached, you can do this afterwards at your own pace.
- [ ] **DNS:** add `AAAA`, name `home`, content `100::`, **Proxied**, so requests still reach Cloudflare and the redirect runs.

## 4. Verify

Each of these should print a `301` with a `location:` on `patrickkearney.dev/resume/...`:

```bash
curl -sI https://home.patrickkearney.dev/ | grep -iE "^(HTTP|location)"
```

```bash
curl -sI https://home.patrickkearney.dev/resume.pdf | grep -iE "^(HTTP|location)"
```

```bash
curl -sI "https://home.patrickkearney.dev/?ref=linkedin" | grep -iE "^(HTTP|location)"
```

Then check these:

- [ ] Paste `https://patrickkearney.dev/resume/` into a LinkedIn or Slack message, and check the preview image and title.
- [ ] Open the PDF from the page.
- [ ] Cloudflare Web Analytics is recording visits on `patrickkearney.dev/resume` (it may need enabling for the apex hostname).

## 5. Afterwards

- [ ] **Search Console:** add or verify `patrickkearney.dev` and submit `https://patrickkearney.dev/sitemap.xml`. Old `home.` results move over as Google follows the 301s, which usually takes a few weeks.
- [ ] **Profiles:** update the site link on LinkedIn and GitHub. The redirect covers old links in the meantime.
- [ ] **Keep the redirect** and the `home` DNS record indefinitely, because they cost nothing.

## Rolling back

1. Revert the merge on `main`. Cloudflare redeploys the old build, which serves from the root again.
2. Disable the Redirect Rule.
3. Re-attach `home.patrickkearney.dev` as a Custom Domain on resume-site. Delete the `home` placeholder record first if Cloudflare asks.
4. The hub can stay on its route; it works the same as with a Custom Domain.
