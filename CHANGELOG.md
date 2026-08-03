# Padeliq — Change & Decision Log

A running log of what changed and *why*. Newest entries first. Each entry records
the change and the decision/reasoning behind it, so the history travels with the repo.

---

## 2026-07-31 — /clubs demo form: extra qualifying fields

- Added three fields to the pilot "Book a demo" form: **Location (city and country)**
  (required), **Club website** (optional, `type=url`), and **Do you already have a court
  camera?** (required select: Yes, on one or more courts / No, not yet / Not sure). The
  camera question qualifies against the pilot's "we'll mount one if you don't" offer.
  - *Gotcha:* a `disabled` placeholder `<option>` gets auto-skipped in Chromium (it selected
    "Yes"). Fixed with a plain `value="" selected` placeholder; `required` + empty value still
    blocks submit until a real choice is made.
  - Dark-themed the dropdown: the native option list was rendering light-grey against the
    dark page. Fixed with `color-scheme: dark` + dark `option` backgrounds; muted the
    placeholder (`:required:invalid`) and added hover/focus polish.
  - Form remains front-end only (thank-you on submit); no backend yet.

---

## 2026-07-31 — /clubs copy reframed around engagement/retention

- Reframed the `/clubs` hero and the "what the club gets" section around a sharper pitch:
  **you already have the camera → offer your players match analysis as your own service →
  they stay engaged and keep booking with your center.** New H1 "The camera's already on
  your court. Turn it into a reason players keep coming back."; hero sub now ends "AI Coach
  Bruno does the reading; the service is yours." Club-value card 1 retitled to "A reason your
  members keep booking with you."
  - *Decision (confirmed with user):* stay **B2B / addressed to club owners** (not re-voiced
    as a center-to-players B2C page), and **keep the AI Coach Bruno brand** (the club runs it
    as their own white-labelled service). Structure and the rest of the sections unchanged —
    they already fit this audience.

---

## 2026-07-31 — /clubs rebuilt as a B2B page (AI Coach Bruno)

- Rebuilt `/clubs` from the duplicated homepage into a **B2B landing page for padel club
  owners**, branded **AI Coach Bruno** (distinct from the player-facing homepage). Sections:
  hero (pilot eyebrow, "Bruno explains it." in the coral gradient, two CTAs, trust strip),
  What your members get (6 cards, the club card highlighted), What the club gets (4 cards),
  How it works (3 steps), a plain integration panel, a pilot-pricing panel with a
  Name/Club/Courts/Email demo form, and a 9-question clubs FAQ. Live at
  https://brunopadel.app/clubs.
  - *Reused* the existing dark design system, the session-player mockup and the court-grid
    background — no new dependencies; still one self-contained file.
  - *Copy decisions (from the brief):* first mention "AI Coach Bruno", plain "Bruno"
    afterwards; Bruno watches/reads/measures/shows, never "recommends" or "advises". Audience
    order preserved: what members get → club effort → euros. Pilot price kept as the brief's
    `€X` placeholder (not invented). Em-dash shorthand in the brief was rendered as card
    title + body, consistent with the standing no-em-dash-in-copy preference.
  - *Front-end only:* the demo form shows a thank-you on submit; no backend is wired yet.

---

## 2026-07-31 — /clubs page

- **Duplicated the landing page to `/clubs`.** Served from `clubs/index.html` — Vercel maps
  a folder's `index.html` to the clean path `/clubs` automatically, so no `vercel.json`
  rewrite was needed. Live at https://brunopadel.app/clubs.
  - *Status:* currently a byte-for-byte copy of the root page — a starting point to tailor
    for a clubs-specific audience. The page is fully self-contained (inline CSS/JS, no
    relative assets), so it works unchanged under the `/clubs` path.

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
