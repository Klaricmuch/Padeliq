# Padeliq — Change & Decision Log

A running log of what changed and *why*. Newest entries first. Each entry records
the change and the decision/reasoning behind it, so the history travels with the repo.

---

## 2026-07-31 — Custom domain

- **Connected custom domain `brunopadel.app`** (registered at Porkbun) to the `padeliq`
  Vercel project. Both the apex and `www.brunopadel.app` are attached to the project;
  verified via the Vercel API that they resolve to `padeliq`, not another project.
  - *Status:* **Live** as of 2026-07-31. DNS configured at Porkbun — apex
    `A → 76.76.21.21` and `www CNAME → cname.vercel-dns.com`, replacing Porkbun's parking
    ALIAS + wildcard CNAME. `www.brunopadel.app` is the primary; the apex 308-redirects to
    `www`. Vercel auto-issued the SSL cert (`.app` is HSTS-preloaded, so HTTPS is
    mandatory). Verified `https://brunopadel.app` and `https://www.brunopadel.app` both
    return 200 and serve the page.
  - *Gotcha for next time:* Porkbun ships a parking `ALIAS @ → pixie.porkbun.com` and a
    `CNAME *` wildcard. An `A` record can't coexist with the root `ALIAS`, and inline
    delete was flaky — replacing/overwriting the records (or "Delete All Records") was the
    clean way through.
  - *Note:* the domain name (`brunopadel.app`) intentionally differs from the project
    name (`padeliq`) — a domain can front any project.

---

## 2026-07-19 — Initial build, publish, and infrastructure

### Deployment & hosting
- **Published to Vercel** via GitHub integration → live at https://padeliq-chi.vercel.app/.
  Auto-deploys on every push to `main`.
  - *Decision:* chose GitHub integration over CLI deploys so pushes auto-publish and
    GitHub stays the single source of truth. No `vercel.json` needed — it's a single
    static `index.html` at the repo root.
- **Created public GitHub repo `Klaricmuch/Padeliq`.** `index.html` is the canonical
  source (the local preview server serves it via symlink; edits go here, not to the
  old Downloads copy).
  - *Decision:* keep Padeliq as its own repo under the personal account — a separate
    brand from Borapadel, cleanly isolated. Public. Can be transferred into a dedicated
    `padeliq` org later without losing history if the project grows.
- **Preview config separated.** Moved the `padeliq-static` preview-server config into a
  project-scoped `.claude/launch.json` (gitignored) so it's no longer mixed with
  `borapadel-dev` in the global `~/.claude/launch.json`.

### Page — built from the funky-v2 base to match the Figma frame (node 8-15)
- **Added "You'll finally discover…" section** — 4 question cards (Rally intelligence,
  Bounce & depth maps, Aggression profile, Court & wall usage).
- **Added FAQ** — "Everything you're wondering." accordion, 6 items, native `<details>`.
- **Removed the trust strip** (stats row) and the **accuracy/honesty section** — both
  absent from the frame.
  - *Decision:* styled the two new sections in the funky **purple** palette rather than
    the navy shown in the frame. The frame's navy was a screenshot artifact from the
    `alien` variant, not an intended color for this page.
- **Logo redesign** — replaced the squircle-with-oval-ring mark with a flat, illustrated,
  centered tennis/padel ball (diagonal double seam).
- **Copy cleanup** — removed em dashes ("—") from all visible content (replaced with
  commas / colons / periods) and removed the decorative dash line before eyebrow labels.
