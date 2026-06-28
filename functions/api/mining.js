// functions/api/mining.js
// Fetches Google Sheet data server-side, avoiding browser CORS restrictions

export async function onRequestGet() {
  const SHEET_ID = '1tfy8xk7zTf1PvNrylXIC7kiO_UwYS_dHQ_6UVDR1lnE';

  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Dashboard`;
    const res  = await fetch(url);
    const text = await res.text();

    // Strip the gviz callback wrapper to get clean JSON
    const jsonStr = text.substring(text.indexOf('(') + 1, text.lastIndexOf(')'));
    const data    = JSON.parse(jsonStr);

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'max-age=300', // cache 5 min
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
