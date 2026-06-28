// functions/api/mining.js
// Fetches BOTH the FVG Mining Tracker (Dashboard tab) and the live BTC price
// server-side, returning a single clean JSON payload. The page makes one call
// and nothing cross-origin can break it. Add ?debug=1 for raw diagnostics.

export async function onRequestGet(context) {
  const { request } = context;
  const debug = new URL(request.url).searchParams.has('debug');
  const SHEET_ID = '1tfy8xk7zTf1PvNrylXIC7kiO_UwYS_dHQ_6UVDR1lnE';
  const GVIZ = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Dashboard`;

  // --- 1. Live BTC price (tries multiple sources; null only if all fail) ---
  // Each source is wrapped so one being down never blocks the others or the page.
  async function getBtcPrice() {
    // Coinbase — reliable server-side, no key, no rate limit for this endpoint
    try {
      const r = await fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot',
        { headers: { 'Accept': 'application/json' } });
      if (r.ok) {
        const j = await r.json();
        const p = parseFloat(j?.data?.amount);
        if (p > 0) return p;
      }
    } catch (_) {}

    // Kraken — fallback
    try {
      const r = await fetch('https://api.kraken.com/0/public/Ticker?pair=XBTUSD',
        { headers: { 'Accept': 'application/json' } });
      if (r.ok) {
        const j = await r.json();
        const result = j?.result;
        const key = result && Object.keys(result)[0];
        const p = key ? parseFloat(result[key]?.c?.[0]) : null;
        if (p > 0) return p;
      }
    } catch (_) {}

    // CoinGecko — last resort (often rate-limited keyless, but try anyway)
    try {
      const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
        { headers: { 'Accept': 'application/json' } });
      if (r.ok) {
        const j = await r.json();
        const p = j?.bitcoin?.usd;
        if (p > 0) return p;
      }
    } catch (_) {}

    return null;
  }

  const btcPrice = await getBtcPrice();

  // --- 2. Sheet data ---
  try {
    const res = await fetch(GVIZ, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FVGDashboard/1.0)' },
      redirect: 'follow',
    });
    const text = await res.text();

    if (debug) {
      return new Response(JSON.stringify({
        ok: res.ok, status: res.status,
        contentType: res.headers.get('content-type'),
        length: text.length, btcPrice, head: text.substring(0, 300),
      }, null, 2), { headers: { 'Content-Type': 'application/json' } });
    }

    const start = text.indexOf('(');
    const end   = text.lastIndexOf(')');
    if (start === -1 || end === -1) {
      throw new Error('Unexpected sheet response (no JSON wrapper). Status ' + res.status);
    }

    const gviz = JSON.parse(text.substring(start + 1, end));
    const rows = gviz.table.rows;
    const cell = (r, c) => { try { return rows[r].c[c]?.v ?? null; } catch { return null; } };

    const btcMined        = cell(0, 5);
    const totalIncome     = cell(1, 5);
    const costBasisPerBTC = cell(2, 5);
    const payouts         = cell(3, 5);

    let headerIdx = rows.findIndex(r => {
      try { const v = r.c[1]?.v; return typeof v === 'string' && v.toLowerCase() === 'month'; }
      catch { return false; }
    });
    const monthly = [];
    if (headerIdx !== -1) {
      for (let i = headerIdx + 1; i < rows.length; i++) {
        const month = cell(i, 1);
        if (!month) break;
        monthly.push({
          month,
          avgTH:     cell(i, 2),
          btcEarned: parseFloat(cell(i, 4)) || 0,
          usdValue:  cell(i, 5),
        });
      }
    }

    return new Response(JSON.stringify({
      btcMined, totalIncome, costBasisPerBTC, payouts, monthly,
      btcPrice,
      lastUpdated: new Date().toISOString().split('T')[0],
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'max-age=300',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'fetch failed', btcPrice }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
