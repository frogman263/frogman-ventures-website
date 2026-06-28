// functions/api/mining.js
// Fetches the FVG Mining Tracker (Dashboard tab) server-side, parses the
// Google Visualization response, and returns clean flat JSON for the page.
// Running server-side avoids the browser CORS block on Google's gviz endpoint.

export async function onRequestGet() {
  const SHEET_ID = '1tfy8xk7zTf1PvNrylXIC7kiO_UwYS_dHQ_6UVDR1lnE';

  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Dashboard`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FVGDashboard/1.0)' },
    });
    const text = await res.text();

    // Strip the /*O_o*/ google.visualization.Query.setResponse( ... ) wrapper
    const jsonStr = text.substring(text.indexOf('(') + 1, text.lastIndexOf(')'));
    const gviz = JSON.parse(jsonStr);
    const rows = gviz.table.rows;

    // Safe cell getter: row index r, column index c
    const cell = (r, c) => {
      try { return rows[r].c[c]?.v ?? null; } catch { return null; }
    };

    // --- Summary metrics live in column F (index 5) ---
    // Row 0: Total BTC Mined | Row 1: Total Income | Row 2: Cost Basis | Row 3: Payouts
    const btcMined        = cell(0, 5);
    const totalIncome     = cell(1, 5);
    const costBasisPerBTC = cell(2, 5);
    const payouts         = cell(3, 5);

    // --- Monthly rows: find the header row where column B (index 1) == "Month" ---
    let headerIdx = rows.findIndex(r => {
      try {
        const v = r.c[1]?.v;
        return typeof v === 'string' && v.toLowerCase() === 'month';
      } catch { return false; }
    });

    const monthly = [];
    if (headerIdx !== -1) {
      for (let i = headerIdx + 1; i < rows.length; i++) {
        const month = cell(i, 1);
        if (!month) break; // stop at first empty month row
        monthly.push({
          month,
          avgTH:     cell(i, 2),
          btcEarned: parseFloat(cell(i, 4)) || 0, // stored as text in the sheet
          usdValue:  cell(i, 5),
        });
      }
    }

    const data = {
      btcMined,
      totalIncome,
      costBasisPerBTC,
      payouts,
      monthly,
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'max-age=300', // cache 5 min so it isn't hammered
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'fetch failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
