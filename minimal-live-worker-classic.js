addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const p = url.pathname

  if (p === '/api/health') {
    return new Response(JSON.stringify({ ok: true, domain: 'saasonsale.com', note: 'Full source ready in workspace/saasonsale. Deploy real bundle for complete AI analyzer, shared services.' }), { headers: { 'content-type': 'application/json' } })
  }
  if (p === '/api/analyze-stack') {
    let body = {}
    try { body = await request.json() } catch (e) {}
    const tools = (body.tools || ['Notion', 'Figma']).slice(0, 6)
    const savings = Math.round(tools.length * 21 + (tools.length % 3) * 7)
    return new Response(JSON.stringify({
      savings,
      score: 89 + (tools.length % 5),
      topSwitches: tools.slice(0, 2).map((t, i) => ({ from: t, to: i === 0 ? 'Cursor (current AI deal)' : 'annual plan on promo', save: Math.round(savings / (2 + i)), reason: 'Strong seasonal discount + better fit' })),
      advice: 'Q2/Q3 window is excellent for AI + design tools. Lock annuals now.'
    }), { headers: { 'content-type': 'application/json' } })
  }
  if (p === '/api/ad-settings') {
    return new Response(JSON.stringify({ adsenseClientId: '', enabled: false, hideAdsForPremium: true, excludedPlacements: ['home', 'premium'], placements: {}, updatedAt: new Date().toISOString() }), { headers: { 'content-type': 'application/json' } })
  }
  if (p === '/ads.txt') return new Response('google.com, pub-1860356577073395, DIRECT, f08c47fec0942fa0\n', { headers: { 'content-type': 'text/plain' } })
  if (p === '/robots.txt') return new Response('User-agent: *\nAllow: /\n', { headers: { 'content-type': 'text/plain' } })

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>saasonsale • SaaS on Sale — AI deals for your stack</title>
<meta name="description" content="AI-powered SaaS deals platform. Paste your stack and get exact seasonal switches + real dollar savings.">
<style>
body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f8fafc;color:#0f172a;line-height:1.45}
header{display:flex;align-items:center;justify-content:space-between;padding:12px 20px;background:#0a2540;color:#fff}
.logo{width:32px;height:32px;background:#22c55e;color:#0a2540;border-radius:7px;display:flex;align-items:center;justify-content:center;font-weight:800}
main{max-width:860px;margin:30px auto;padding:0 16px}
h1{font-size:36px;letter-spacing:-1px}
.card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:14px;margin:12px 0}
button{background:#22c55e;color:#052e16;border:none;padding:8px 14px;border-radius:8px;font-weight:700;cursor:pointer}
.chip{border:1px solid #cbd5e1;padding:3px 8px;border-radius:999px;font-size:12px;margin:2px;display:inline-block;cursor:pointer}
.chip.on{background:#0a2540;color:#fff}
.deal{display:inline-block;background:#fff;border:1px solid #e2e8f0;padding:8px;border-radius:8px;margin:4px;font-size:13px}
footer{text-align:center;font-size:11px;color:#64748b;margin-top:30px}
</style></head>
<body>
<header>
  <div style="display:flex;align-items:center;gap:10px"><div class="logo">S</div><div><strong>saasonsale.com</strong></div></div>
  <div><a href="https://growth.business" style="color:#67e8f9;text-decoration:none;font-size:12px">growth.business hub</a></div>
</header>
<main>
  <h1>SaaS on Sale.<br>Save thousands this season.</h1>
  <p>AI-powered platform for discovering the best seasonal SaaS deals. Analyze your stack for savings, get personalized recommendations. Same framework as doting.co and watershortcut.com.</p>
  <div class="card">
    <strong>Demo Stack Analyzer</strong><br>
    <div id="chips"></div>
    <button onclick="analyze()">Analyze my stack</button>
    <div id="out" style="margin-top:10px;font-size:14px"></div>
  </div>
  <div class="card">
    <strong>Sample Hot Deals</strong><br>
    <div class="deal">Cursor — 40% off <button onclick="alert('In full version: tracks affiliate conversion, uses shared billing for credits.')">Claim</button></div>
    <div class="deal">Notion — 50% off <button onclick="alert('In full version: tracks affiliate conversion, uses shared billing for credits.')">Claim</button></div>
    <div class="deal">Linear — 20% off <button onclick="alert('In full version: tracks affiliate conversion, uses shared billing for credits.')">Claim</button></div>
  </div>
  <p style="font-size:12px">This is a live preview. The full production build (React UI, real AI via shared PortfolioAIService, D1 analytics & ad controls, credits from riskfreetrial, etc.) is in the GitHub repo and workspace/saasonsale. Deploy the real bundle for the complete experience.</p>
</main>
<footer>Part of Nir's 75-domain automated revenue platform • <a href="https://riskfreetrial.org">riskfreetrial billing hub</a></footer>
<script>
let sel = ["Notion","Figma","Cursor"];
function rc() {
  let e = document.getElementById("chips"); e.innerHTML = "";
  ["Notion","Figma","Cursor","Linear","Claude"].forEach(t => {
    let b = document.createElement("span");
    b.className = "chip" + (sel.includes(t) ? " on" : "");
    b.textContent = t;
    b.onclick = () => { sel = sel.includes(t) ? sel.filter(x => x != t) : [...sel, t]; rc(); };
    e.appendChild(b);
  });
}
window.analyze = function() {
  let est = sel.length * 21 + Math.floor(Math.random()*15);
  document.getElementById("out").innerHTML = "Estimated annual savings: <strong>$" + est + "</strong><br>Top switch: " + sel[0] + " → Cursor or annual on sale.<br><small>Full shared AI + personalized results in the production build.</small>";
};
rc();
</script>
</body></html>`;
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
}
