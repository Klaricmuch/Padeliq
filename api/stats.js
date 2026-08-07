// Vercel serverless function: returns visit counts for / and /clubs from PostHog,
// for two windows (last 7 days and last 30 days).
// Env vars (Vercel → Project → Settings → Environment Variables):
//   POSTHOG_API_KEY     — a PostHog *personal* API key (phx_…) with query read scope (secret)
//   POSTHOG_PROJECT_ID  — the numeric project id (e.g. 242171)
//   POSTHOG_HOST        — e.g. https://eu.posthog.com (optional; defaults to EU)
module.exports = async (req, res) => {
  const KEY = process.env.POSTHOG_API_KEY;
  const PROJECT = process.env.POSTHOG_PROJECT_ID;
  const HOST = (process.env.POSTHOG_HOST || 'https://eu.posthog.com').replace(/\/$/, '');

  if (!KEY || !PROJECT) {
    res.status(500).json({ error: 'PostHog env vars not set (POSTHOG_API_KEY / POSTHOG_PROJECT_ID).' });
    return;
  }

  const hogql =
    "SELECT properties.$pathname AS path, " +
    "countIf(timestamp > now() - INTERVAL 7 DAY) AS v7, " +
    "count(DISTINCT if(timestamp > now() - INTERVAL 7 DAY, person_id, NULL)) AS u7, " +
    "count() AS v30, " +
    "count(DISTINCT person_id) AS u30 " +
    "FROM events " +
    "WHERE event = '$pageview' " +
    "AND timestamp > now() - INTERVAL 30 DAY " +
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
    const out = {
      d7:  { home: { views: 0, visitors: 0 }, clubs: { views: 0, visitors: 0 } },
      d30: { home: { views: 0, visitors: 0 }, clubs: { views: 0, visitors: 0 } }
    };
    (data.results || []).forEach((row) => {
      const path = row[0];
      const key = path === '/' ? 'home' : path === '/clubs' ? 'clubs' : null;
      if (!key) return;
      out.d7[key]  = { views: Number(row[1]) || 0, visitors: Number(row[2]) || 0 };
      out.d30[key] = { views: Number(row[3]) || 0, visitors: Number(row[4]) || 0 };
    });
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.status(200).json(out);
  } catch (e) {
    res.status(500).json({ error: 'stats error', detail: String(e).slice(0, 300) });
  }
};
