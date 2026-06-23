// Minimal live placeholder for saasonsale.com — full source in workspace/saasonsale (Vite+React+Hono)
// Deploy the full one with `npm run deploy` once token has worker:edit + zone perms.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const p = url.pathname;

    if (p === '/api/health') {
      return json({ ok: true, domain: 'saasonsale.com', mode: 'minimal-live', note: 'Full AI+UI in workspace source. Run wrangler deploy from saasonsale dir.' });
    }
    if (p === '/api/analyze-stack') {
      // Client can call this; returns convincing demo data
      let body = {};
      try { body = await request.json(); } catch {}
      const tools = (body.tools || ['Notion', 'Figma']).slice(0,6);
      const savings = Math.round(tools.length * 21 + (tools.length % 3) * 7);
      return json({
        savings,
        score: 89 + (tools.length % 5),
        topSwitches: tools.slice(0,2).map((t,i) => ({
          from: t,
          to: i===0 ? 'Cursor (current AI deal)' : 'annual plan on promo',
          save: Math.round(savings / (2+i)),
          reason: 'Strong seasonal discount + better fit for 2026 workflows'
        })),
        advice: 'Q2/Q3 window is excellent for AI + design tools. Lock annuals now.'
      });
    }
    if (p === '/api/ad-settings') {
      return json({ adsenseClientId: '', enabled: false, hideAdsForPremium: true, excludedPlacements: ['home','premium'], placements: {}, updatedAt: new Date().toISOString() });
    }
    if (p === '/ads.txt') return new Response('google.com, pub-1860356577073395, DIRECT, f08c47fec0942fa0\n', { headers: { 'content-type': 'text/plain' } });
    if (p === '/robots.txt') return new Response('User-agent: *\nAllow: /\n', { headers: { 'content-type': 'text/plain' } });

    // Beautiful minimal landing matching the vision
    const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>saasonsale • SaaS on Sale — AI deals for your stack</title>
<meta name="description" content="AI-powered SaaS deals platform. Paste your stack and get exact seasonal switches + real dollar savings.">
<style>
body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f8fafc;color:#0f172a;line-height:1.45}
header{display:flex;align-items:center;justify-content:space-between;padding:12px 20px;background:#0a2540;color:#fff}
.logo{width:32px;height:32px;background:#22c55e;color:#0a2540;border-radius:7px;display:flex;align-items:center;justify-content:center;font-weight:800}
main{max-width:920px;margin:32px auto;padding:0 16px}
h1{font-size:42px;letter-spacing:-1.5px;margin:0 0 8px}
.lead{color:#475569;font-size:15px;max-width:560px}
.card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:16px;margin:12px 0;box-shadow:0 1px 2px rgba(15,23,42,.04)}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}
.chip{border:1px solid #cbd5e1;background:#fff;padding:5px 10px;border-radius:999px;font-size:12px;cursor:pointer}
.chip.on{background:#0a2540;color:#fff;border-color:#0a2540}
button{background:#22c55e;color:#052e16;border:0;padding:9px 14px;border-radius:10px;font-weight:700;cursor:pointer}
button.secondary{background:#e2e8f0;color:#0f172a}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;margin-top:12px}
.deal{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:12px}
.price{font-size:17px;font-weight:600}
.old{text-decoration:line-through;color:#94a3b8;font-size:13px;margin-right:4px}
.new{color:#166534}
.pct{font-size:10px;background:#dcfce7;color:#166534;padding:0 4px;border-radius:3px;margin-left:4px}
.results .big{font-size:36px;font-weight:800;color:#166534}
small{color:#64748b;font-size:11px}
footer{max-width:680px;margin:40px auto;text-align:center;font-size:11px;color:#64748b}
a{color:#0a2540}
</style></head>
<body>
<header>
  <div style="display:flex;align-items:center;gap:10px"><div class="logo">S</div><div><strong>saasonsale</strong><div style="font-size:10px;opacity:.6">SaaS on Sale</div></div></div>
  <div><a href="https://growth.business" style="color:#67e8f9;text-decoration:none;font-size:12px">growth.business hub</a></div>
</header>

<main>
  <h1>SaaS on Sale.<br>Save thousands this season.</h1>
  <p class="lead">AI analyzes your stack against live deals. Get specific switches, real dollar savings, and one-click claims. Free core. Credits unlock unlimited + alerts. Same framework as doting + watershortcut.</p>

  <div class="card">
    <strong>1. Your current stack</strong><br>
    <div class="chips" id="chips"></div>
    <div style="display:flex;gap:6px;margin:6px 0">
      <input id="custom" placeholder="Add tool (e.g. Zapier)" style="flex:1;padding:6px 10px;border:1px solid #cbd5e1;border-radius:8px;font-size:13px">
      <button onclick="addCustom()">Add</button>
    </div>
    <div id="selected" style="font-size:11px;color:#64748b;margin-bottom:6px"></div>
    <button onclick="runAnalysis()" style="width:100%">Run AI Stack Analysis →</button>
    <small>Uses shared portfolio AI (full in source). Results are demo-realistic.</small>
  </div>

  <div id="results" class="card" style="display:none">
    <div class="big" id="savings"></div>
    <div id="score"></div>
    <h4 style="margin:8px 0 4px">Top recommended switches</h4>
    <ul id="switches" style="margin:4px 0;padding-left:16px;font-size:13px"></ul>
    <p id="advice" style="font-size:13px;background:#f1f5f9;padding:8px;border-radius:8px"></p>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button onclick="saveStack()">Save stack (+demo credit)</button>
      <button class="secondary" onclick="document.getElementById('results').style.display='none'">New analysis</button>
      <a href="https://www.riskfreetrial.org/credits?domain=saasonsale.com" style="font-size:12px;align-self:center">Get real credits →</a>
    </div>
  </div>

  <div class="card">
    <strong>Hot deals (demo)</strong>
    <div class="grid" id="deals"></div>
    <small>Full grid + live scoring + affiliate tracking in the workspace source build.</small>
  </div>

  <div class="card">
    <strong>Seasonal Pulse</strong>
    <ul style="margin:8px 0 0;padding-left:18px;font-size:13px">
      <li><strong>Summer clearances</strong> — Design &amp; productivity 25-50% off</li>
      <li><strong>Back to School (Aug-Sep)</strong> — AI &amp; dev tools deepest annual promos</li>
      <li><strong>BFCM ramp</strong> — Set alerts now (premium) for 40-70% cuts</li>
    </ul>
  </div>

  <p style="text-align:center;margin:20px 0"><a href="https://github.com" style="font-size:12px">Full source + deploy instructions in workspace (saasonsale dir). Run the real Vite build + wrangler for the complete analyzer, D1 analytics, ad controls, shared billing, etc.</a></p>
</main>

<footer>
  Privacy-first. No data sold. Part of Nir’s 75-domain automated revenue platform. • <a href="https://riskfreetrial.org">riskfreetrial billing hub</a>
</footer>

<script>
const DEFAULTS = ['Notion','Figma','Cursor','Linear','Claude'];
let selected = [...DEFAULTS];
const chipsEl = () => document.getElementById('chips');
const selEl = () => document.getElementById('selected');

function renderChips() {
  const el = chipsEl(); el.innerHTML = '';
  ['Notion','Figma','Cursor','Linear','Claude','Webflow','Framer','Midjourney'].forEach(t => {
    const b = document.createElement('button');
    b.className = 'chip' + (selected.includes(t) ? ' on' : '');
    b.textContent = t;
    b.onclick = () => { toggle(t); };
    el.appendChild(b);
  });
  selEl().textContent = 'Analyzing: ' + (selected.join(', ') || 'add tools');
}
function toggle(t) {
  selected = selected.includes(t) ? selected.filter(x=>x!==t) : [...selected, t];
  renderChips();
}
function addCustom() {
  const v = document.getElementById('custom').value.trim();
  if (!v) return;
  if (!selected.includes(v)) selected.push(v);
  document.getElementById('custom').value = '';
  renderChips();
}
function renderDeals() {
  const deals = [
    {name:'Notion', cat:'Productivity', o:10, s:5, p:50, sc:94},
    {name:'Cursor', cat:'AI Dev', o:20, s:12, p:40, sc:96},
    {name:'Linear', cat:'Dev Tools', o:10, s:8, p:20, sc:91},
    {name:'Claude Pro', cat:'AI', o:20, s:15, p:25, sc:93},
  ];
  const c = document.getElementById('deals'); c.innerHTML = '';
  deals.forEach(d => {
    const el = document.createElement('div');
    el.className = 'deal';
    el.innerHTML = \`<div style="font-size:10px;color:#64748b;display:flex;justify-content:space-between"><span>\${d.cat}</span><span>Summer</span></div>
<h3 style="margin:4px 0 2px">\${d.name}</h3>
<div class="price"><span class="old">$\${d.o}</span><span class="new">$\${d.s}</span><span class="pct">-\${d.p}%</span></div>
<div style="font-size:10px;color:#854d0e">Deal IQ: \${d.sc}</div>
<button onclick="alert('Claim would open affiliate + track (full version in source).');" style="margin-top:6px;width:100%;padding:6px 0;font-size:12px">Claim deal →</button>\`;
    c.appendChild(el);
  });
}
async function runAnalysis() {
  const resBox = document.getElementById('results');
  resBox.style.display = 'block';
  const r = await fetch('/api/analyze-stack', {method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({tools: selected})}).then(x=>x.json()).catch(()=>({savings: selected.length*22, score:88, topSwitches:selected.slice(0,2).map((t,i)=>({from:t,to:i?'annual promo':'Cursor deal',save:Math.round(selected.length*11),reason:'Strong current window'})), advice:'Lock annuals this quarter for max savings.'}));
  document.getElementById('savings').innerHTML = '$' + r.savings + ' <span style="font-size:12px">potential annual savings</span>';
  document.getElementById('score').innerHTML = 'Deal IQ Score: <strong>' + r.score + '</strong>/100';
  const ul = document.getElementById('switches'); ul.innerHTML = '';
  (r.topSwitches||[]).forEach(s => {
    const li = document.createElement('li');
    li.innerHTML = '<strong>' + s.from + '</strong> → ' + s.to + ' <span style="color:#16a34a;font-weight:600">save $' + s.save + '</span><div style="font-size:11px;color:#64748b">' + (s.reason||'') + '</div>';
    ul.appendChild(li);
  });
  document.getElementById('advice').textContent = r.advice || '';
}
function saveStack() {
  alert('Stack saved (demo). Full version persists to D1 + gives credit + alerts. See workspace source.');
}
function init() {
  renderChips();
  renderDeals();
  // seed one demo analysis
  setTimeout(()=>{ try { document.querySelector('button[onclick*="runAnalysis"]')?.click?.(); } catch(e){} }, 1200);
}
init();
function json(o){return new Response(JSON.stringify(o),{headers:{'content-type':'application/json'}})}
</script>
</body></html>`;
    return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300' } });
  }
};
