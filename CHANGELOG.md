# Padeliq — Change & Decision Log

A running log of what changed and *why*. Newest entries first. Each entry records
the change and the decision/reasoning behind it, so the history travels with the repo.

---

## 2026-07-31 — Homepage nav: fix dead "Accuracy" link

- The homepage nav's "Accuracy" link pointed at `#trust`, a section removed back in the
  initial build, so it scrolled nowhere. Repointed it to the existing `#faq` section and
  relabelled it "FAQ". Homepage nav is now Metrics · How it works · FAQ.

---

## 2026-07-31 — Homepage rebrand: PadelIQ → AI Coach Bruno

- Aligned the player homepage (`/`) to the **AI Coach Bruno** brand used on `/clubs` (it was
  still the legacy placeholder "PadelIQ"). Updated the `<title>`, nav + footer logos, the hero
  lede and the how-it-works copy; applied the naming convention (logo + first mention =
  "AI Coach Bruno", plain "Bruno" after). Footer's old placeholder note replaced with a
  "For clubs →" link to `/clubs` (mirrors the `/clubs` footer linking back to `/`).
  - *Decision:* standardised on "AI Coach Bruno" (not "Bruno Padel") — it's the product brand
    already live on `/clubs`. Only 2 non-visible HTML comments still say "PadelIQ".

---

## 2026-07-31 — /clubs demo form → Supabase

- Wired the pilot demo form to persist leads to **Supabase** (a new, dedicated project,
  kept separate from Borapadel). On submit the form does `POST /rest/v1/club_leads` with the
  project's **publishable/anon key**; adds a `Sending…` state, success → the thank-you,
  failure → a visible error + retry.
  - *Security model:* the table has RLS enabled with an **insert-only** policy for `anon` and
    **no SELECT policy** — the public key (embedded in the page, by design) can add leads but
    cannot read them back. Leads are read from the Supabase dashboard.
  - *Verified end-to-end:* an empty-insert probe returned a NOT NULL `400` (table + key +
    policy live, no row written); a valid insert returned `201`; the CORS preflight from
    `brunopadel.app` returns `Allow-Origin: *`, so the browser fetch isn't blocked.
  - *Decision:* couldn't create the project/table from here — the Supabase CLI is signed into
    a different account than the project's org — so the user created the project and ran the
    table SQL; this session verified and wired the client side.
  - *Known tradeoff:* a public insert form can be spam-inserted with the visible key
    (acceptable for a low-volume lead form; add a captcha/Turnstile later if abuse appears).

---

## 2026-07-31 — /clubs demo form: extra qualifying fields

- Added three fields to the pilot "Book a demo" form: **Location (city and country)**
  (required), **Club website** (optional, `type=url`), and **Do you already have a court
  camera?** (required select: Yes, on one or more courts / No, not yet / Not sure). The
  camera question qualifies against the pilot's "we'll mount one if you don't" offer.
  - *Gotcha:* a `disabled` placeholder `<option>` gets auto-skipped in Chromium (it selected
    "Yes"). Fixed with a plain `value="" selected` placeholder; `required` + empty value still
    blocks submit until a real choice is made.
  - **Dropdown styling:** first tried `color-scheme: dark` + dark `option` backgrounds — worked
    in Chromium but **not Safari**, which draws its own translucent system menu for `<select>`
    popups and ignores option styling. Replaced the native `<select>` with a **custom
    accessible dropdown** (button + `role="listbox"` + hidden input): matches the dark theme in
    every browser, supports keyboard + ARIA, closes on outside-click/Escape.
  - Form remains front-end only. The custom dropdown can't use native `required`, so submit is
    guarded by a small `bookDemo()` handler that blocks + highlights until a camera answer is
    chosen (other fields still use native `required`). Thank-you shown on valid submit; no
    backend yet.

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
