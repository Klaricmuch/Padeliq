// Vercel serverless function: returns visit counts for / and /clubs from PostHog.
// Env vars (set in Vercel → Project → Settings → Environment Variables):
//   POSTHOG_API_KEY     — a PostHog *personal* API key with query read scope (secret; server-side only)
//   POSTHOG_PROJECT_ID  — the numeric project id
//   POSTHOG_HOST        — e.g. https://eu.posthog.com  (optional; defaults to EU)
module.exports = async (req, res) => {
  const KEY = process.env.POSTHOG_API_KEY;
  const PROJECT = process.env.POSTHOG_PROJECT_ID;
  const HOST = (process.env.POSTHOG_HOST || 'https://eu.posthog.com').replace(/\/$/, '');
  const DAYS = 30;

  if (!KEY || !PROJECT) {
    res.status(500).json({ error: 'PostHog env vars not set (POSTHOG_API_KEY / POSTHOG_PROJECT_ID).' });
    return;
  }

  const hogql =
    "SELECT properties.$pathname AS path, count() AS views, count(DISTINCT person_id) AS visitors " +
    "FROM events " +
    "WHERE event = '$pageview' " +
    "AND timestamp > now() - INTERVAL " + DAYS + " DAY " +
    "AND properties.$pathname IN ('/', '/clubs') " +
    "GROUP BY path";

  try {
    const r = await fetch(HOST + '/api/projects/' + PROJECT + '/query/', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: { kind: 'HogQLQuery', query: hogql } })
    });
    if (!r.ok) {
      const t = await r.text();
      res.status(502).json({ error: 'PostHog query failed', status: r.status, detail: t.slice(0, 300) });
      return;
    }
    const data = await r.json();
    const out = { home: { views: 0, visitors: 0 }, clubs: { views: 0, visitors: 0 }, window_days: DAYS };
    (data.results || []).forEach((row) => {
      const path = row[0], views = Number(row[1]) || 0, visitors = Number(row[2]) || 0;
      if (path === '/') out.home = { views, visitors };
      else if (path === '/clubs') out.clubs = { views, visitors };
    });
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.status(200).json(out);
  } catch (e) {
    res.status(500).json({ error: 'stats error', detail: String(e).slice(0, 300) });
  }
};
