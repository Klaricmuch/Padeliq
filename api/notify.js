// Vercel serverless function: emails you a lead notification via Resend.
// Called by the /clubs and homepage forms on EVERY submission — independent of Supabase,
// so you still get the lead by email even if the database write failed (e.g. project paused).
//
// Env vars (Vercel → Project → Settings → Environment Variables):
//   RESEND_API_KEY    — a Resend API key with "Sending access" (secret)
//   LEAD_NOTIFY_TO    — recipient address(es), comma-separated (e.g. you@gmail.com,brand@gmail.com)
//   LEAD_NOTIFY_FROM  — optional sender on the verified domain (default below)

function readBody(req) {
  return new Promise(function (resolve) {
    if (req.body !== undefined && req.body !== null && typeof req.body === 'object') { resolve(req.body); return; }
    if (typeof req.body === 'string') { try { resolve(JSON.parse(req.body)); } catch (e) { resolve({}); } return; }
    var chunks = [];
    req.on('data', function (c) { chunks.push(c); });
    req.on('end', function () { try { resolve(JSON.parse(Buffer.concat(chunks).toString() || '{}')); } catch (e) { resolve({}); } });
    req.on('error', function () { resolve({}); });
  });
}

function esc(s) {
  return String(s === null || s === undefined ? '' : s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ ok: false, error: 'POST only' }); return; }

  var KEY = process.env.RESEND_API_KEY;
  var TO = (process.env.LEAD_NOTIFY_TO || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  var FROM = process.env.LEAD_NOTIFY_FROM || 'AI Coach Bruno <leads@brunopadel.app>';
  if (!KEY || !TO.length) {
    res.status(500).json({ ok: false, error: 'Email not configured — set RESEND_API_KEY and LEAD_NOTIFY_TO in Vercel.' });
    return;
  }

  var body = await readBody(req);
  var type = body && body.type === 'home' ? 'home' : 'clubs';
  var saved = !!(body && body.saved);
  var data = (body && body.data) || {};

  var title = type === 'home' ? 'New homepage email signup' : 'New club demo request';
  var fields = type === 'home'
    ? [['Email', data.email], ['Source', data.source]]
    : [['Club', data.club], ['Name', data.name], ['Location', data.location], ['Courts', data.courts],
       ['Email', data.email], ['Has camera', data.has_camera], ['Website', data.website], ['Page', data.source_url]];

  var rows = fields.map(function (f) {
    return '<tr><td style="padding:4px 14px 4px 0;color:#7a7a8a;white-space:nowrap">' + esc(f[0]) +
           '</td><td style="padding:4px 0;font-weight:600;color:#111">' + esc(f[1] || '—') + '</td></tr>';
  }).join('');

  var statusLine = saved
    ? '<p style="margin:0 0 10px;color:#2e7d32">&#9989; Saved to the database.</p>'
    : '<p style="margin:0 0 10px;color:#c62828;font-weight:700">&#9888;&#65039; DATABASE WRITE FAILED &mdash; this email is your only copy of this lead. (Supabase may be paused or down.)</p>';

  var html = '<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:14px;color:#222;line-height:1.5">' +
    '<h2 style="margin:0 0 10px">&#127934; ' + esc(title) + '</h2>' + statusLine +
    '<table style="border-collapse:collapse;margin-top:6px">' + rows + '</table>' +
    '<p style="margin:16px 0 0;font-size:12px;color:#9a9aa8">Sent by AI Coach Bruno &middot; brunopadel.app</p></div>';

  var label = type === 'home' ? (data.email || '') : (data.club || data.email || '');
  var subject = (saved ? '' : '⚠️ [DB FAILED] ') + title + (label ? ' — ' + label : '');

  try {
    var r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: TO, subject: subject, html: html })
    });
    if (!r.ok) {
      var t = await r.text();
      res.status(502).json({ ok: false, error: 'Resend send failed', status: r.status, detail: t.slice(0, 300) });
      return;
    }
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'notify error', detail: String(e).slice(0, 200) });
  }
};
