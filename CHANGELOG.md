# Padeliq — Change & Decision Log

A running log of what changed and *why*. Newest entries first. Each entry records
the change and the decision/reasoning behind it, so the history travels with the repo.

---

## 2026-08-05 — Auth emails via Resend (custom SMTP)

- Configured the new Supabase project's Auth emails to send via **Resend** custom SMTP (from
  `login@brunopadel.app`), replacing Supabase's rate-limited built-in email. Verified the
  domain in Resend (DKIM `resend._domainkey`, SPF + MX on `send`, DMARC — all added at Porkbun
  and propagated), and set Supabase → Auth → SMTP to `smtp.resend.com:465` (user `resend`,
  password = Resend API key).
  - *Why:* the built-in sender is capped at a few emails/hour (we hit a `429`) and lands in
    spam; Resend removes the limit and authenticates the domain (DKIM/SPF/DMARC).
  - *Verified:* a magic-link request now returns `200` (was `429`) — the send goes through
    Resend, from the brand domain. External config only; nothing in this repo.
  - Also fixed the earlier `localhost:3000` redirect: set the project's Site URL to
    `https://www.brunopadel.app` and allow-listed `…/admin` (+ `/**`) in Redirect URLs.

---

## 2026-08-05 — Admin login → magic link (passwordless)

- Switched `/admin` from email+password to **passwordless magic-link** login: enter an admin
  email → Supabase emails a one-time sign-in link → clicking it returns to `/admin` with a
  session (implicit flow — tokens parsed from the URL hash, then the URL is cleaned).
  `create_user:false`, so only existing admin users get a link; the leads read stays gated by
  the email-restricted RLS policy.
  - *Requires (new project):* Site URL + a Redirect-URL allow-list entry for
    `https://www.brunopadel.app/admin` (Auth → URL Configuration).
  - *Verified:* page live; the OTP endpoint accepts the key (a throwaway email returns the
    expected `otp_disabled`). The real-email sign-in is tested by the user.

---

## 2026-08-05 — Leads record their submission page

- The `/clubs` form now records the submit URL (`source_url = window.location.href`), and the
  admin leads table shows a **Page** column (the path, linked to the full URL). Added a
  `source_url` column to `club_leads`. Deployed the form change only after the column existed,
  so the live insert never broke. Verified: insert with `source_url` → 201; Page column live.

---

## 2026-08-05 — Admin stats: 7d/30d toggle + funnel view

- Restructured the admin stats into two **funnels** — Homepage (Visitors → Email signups) and
  `/clubs` (Visitors → Demo requests), each with bars + a conversion % — plus a **7-day /
  30-day** window toggle. `/api/stats` now returns both windows (`d7`/`d30`, via `countIf` /
  `count(DISTINCT if(...))`); the form-fill and signup counts are windowed client-side from
  `created_at`.
  - *Verified:* `/api/stats` returns the `d7`/`d30` structure; the funnel markup + toggle are
    live on `/admin`.

---

## 2026-08-05 — Admin stats (visits + form fills)

- Added a stats row to `/admin`: **Homepage visitors**, **/clubs visitors**, **/clubs form
  fills**, **Homepage signups**, plus a `/clubs` conversion %.
  - **Visits** come from **PostHog** via a new Vercel serverless function `api/stats.js`
    (HogQL `$pageview` query, last 30 days). The PostHog *personal* API key stays server-side
    in Vercel env vars — never in the client. `/api/stats` returns `{home,clubs}` counts.
  - **Homepage signups:** wired the homepage hero + CTA email forms to insert into a new
    `email_signups` table (source-tagged, best-effort — always shows the thank-you). They were
    front-end-only before.
  - **/clubs form fills:** the existing `club_leads` count.
  - *Configured & verified:* `email_signups` table created; Vercel env vars set (PostHog
    project `242171`, EU host, `phx_` personal key); `/api/stats` returns live counts and a
    test signup insert returned `201`. Cards degrade gracefully to "—"/"stats unavailable" if
    the function ever errors.

---

## 2026-08-05 — Switch Supabase project (new account)

- Repointed the `/clubs` form and the `/admin` dashboard from the old Supabase project
  (`zytpl…`) to a **new project on a different account** (`dybyhptwmzjadeysylbo`): updated
  `SUPABASE_URL` + publishable key in both pages, and the admin's Supabase quick-link.
  The table + insert RLS + Slack trigger + admin read policy were recreated on the new
  project (SQL run by the user — I can't access it).
  - Admin read policy allows **two admin emails** (the brand + owner accounts).
  - *Verified:* deployed pages reference the new project; a real insert returned `201` and
    fired the Slack trigger. The old project is now orphaned — no code references it.

---

## 2026-08-05 — /admin hub (login + leads dashboard)

- Added a private **`/admin`** page: a **Supabase-Auth** email/password login gating a **leads
  dashboard** (reads `club_leads`, newest first) plus quick links to PostHog, Supabase and
  Slack. Static HTML, plain `fetch` (no supabase-js), brand-themed; `noindex` + robots
  `Disallow: /admin`. No PostHog on this page (don't track the admin).
  - *Decision:* real Supabase Auth, not a client-side password — the page exposes personal
    data (names/emails). Session token in localStorage with a refresh-token retry on 401.
    Reads are gated by RLS, so the public key alone can't read leads without a valid admin JWT.
  - *Verified:* page live (200); the EU auth endpoint accepts the publishable key (a dummy
    login returns `invalid_credentials`, not a key error), so sign-in works once the admin
    user + read policy exist.
  - *Pending on the Supabase side (user):* create the admin user, disable public sign-ups, and
    add an email-restricted SELECT policy on `club_leads`.

---

## 2026-08-05 — PostHog analytics + session replay

- Added the PostHog **HTML snippet** to the `<head>` of both `/` and `/clubs` (EU cloud,
  project `phc_v4A59…`, `person_profiles: identified_only`). Gives autocaptured pageviews +
  clicks/interactions and session recording.
  - *Decision:* the HTML snippet (manual) over PostHog's framework wizard / open-a-PR flow —
    the site is static HTML (not a framework), and manual avoids connecting PostHog to GitHub
    (the repo is under a different account than the PostHog login).
  - *Verified:* the SDK loads and initializes in-browser on the live site (distinct_id +
    session started, `capture()` ready); a direct event to the EU ingestion API returned
    `{"status":"Ok"}`.
  - *Pending on the PostHog side:* enable **Session Replay** in project settings (recordings
    only capture once that toggle is on). EU cookie-consent is worth considering before
    tracking (Portugal audience) — can add an opt-in banner if wanted.

---

## 2026-08-05 — Favicon + Open Graph / Twitter cards

- Added a tennis-ball **favicon** (`favicon.svg` + `favicon-32.png` + a dark-bg
  `apple-touch-icon.png`) and per-page **Open Graph / Twitter Card** tags on both `/` and
  `/clubs`, each with its own **1200×630** share image (`og-home.png` / `og-clubs.png`).
  Images were rendered from small HTML templates via **headless Chrome** (no design tooling
  installed), then sized with `sips`.
  - *Decision:* raster **PNG** OG images, not SVG — Slack/Twitter/WhatsApp/Facebook don't
    render SVG OG images. Page-specific cards so a shared `/clubs` link previews the
    club-facing message, not the player homepage.
  - All assets served from the repo root by Vercel; verified `200` + correct content-types,
    and `og:`/`twitter:` tags present on both deployed pages.

---

## 2026-08-04 — SEO: sitemap, robots.txt, Search Console

- Added `sitemap.xml` (lists `/` and `/clubs`, canonical `www` URLs) and `robots.txt`
  (allow-all + `Sitemap:` pointer). Both served at the domain root by Vercel; verified live
  (`sitemap.xml` → 200 `application/xml`).
- Verified the domain in **Google Search Console** via a DNS **TXT** record at Porkbun
  (`google-site-verification=…`); confirmed it had propagated to Google's resolver before
  verifying. The TXT record must stay in place permanently (removing it un-verifies the
  property).
  - *Decision:* DNS "Domain" property over an HTML meta-tag "URL-prefix" property — one
    verification covers apex, `www`, and every subdomain / protocol.

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

## 2026-07-31 — Slack notifications for new leads

- New `club_leads` inserts now post to **Slack** (#form-submissions in padel-iq-workspace)
  via a Postgres `AFTER INSERT` trigger that calls a Slack Incoming Webhook using **pg_net**
  (`net.http_post`). Lives in Supabase (SQL), not in this repo.
  - *Decision:* a DB trigger + pg_net rather than an Edge Function or a client-side call —
    one SQL run, nothing to deploy, and the webhook URL stays **server-side in the DB
    function**, never in the public page. Fire-and-forget, so a Slack outage can't block or
    lose a lead.
  - *Verified end-to-end:* a live API insert (`201`) produced the formatted Slack message in
    #form-submissions.
  - *Secret:* the Slack webhook URL exists only inside the DB function; it is **not** committed
    to this repo.

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
