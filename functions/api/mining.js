// functions/api/mining.js
// Fetches the FVG Mining Tracker (Dashboard tab) server-side and returns clean JSON.
// Add ?debug=1 to the URL to see raw diagnostics if something fails.

export async function onRequestGet(context) {
  const { request } = context;
  const debug = new URL(request.url).searchParams.has('debug');
  const SHEET_ID = '1tfy8xk7zTf1PvNrylXIC7kiO_UwYS_dHQ_6UVDR1lnE';
  const GVIZ = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Dashboard`;

  try {
    const res = await fetch(GVIZ, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FVGDashboard/1.0)' },
      redirect: 'follow',
    });
    const text = await res.text();

    // If debug requested, dump what Google actually returned
    if (debug) {
      return new Response(JSON.stringify({
        ok: res.ok,
        status: res.status,
        contentType: res.headers.get('content-type'),
        length: text.length,
        head: text.substring(0, 400),
      }, null, 2), { headers: { 'Content-Type': 'application/json' } });
    }

    const start = text.indexOf('(');
    const end   = text.lastIndexOf(')');
    if (start === -1 || end === -1) {
      throw new Error('Unexpected response from sheet (no JSON wrapper). Status ' + res.status);
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
      lastUpdated: new Date().toISOString().split('T')[0],
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'max-age=300',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'fetch failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
