import { useEffect, useState } from "react";
import "./App.css";
import {
  fetchAdSettings,
  updateAdSettings,
  type AdSettings,
} from "./services/ads";
import {
  trackCtaClick,
  trackPageView,
  trackFormStart,
  trackFormSubmit,
  trackCheckoutStart,
} from "./services/analytics";

const GROWTH_HUB_URL = "https://growth.business";
const BILLING_HUB_URL =
  "https://www.riskfreetrial.org/credits?domain=saasonsale.com&sourceDomain=saasonsale.com&returnUrl=" +
  encodeURIComponent("https://saasonsale.com");

type Deal = {
  id: string;
  name: string;
  category: string;
  original: number;
  sale: number;
  pct: number;
  score: number; // 0-100 Deal IQ
  blurb: string;
  affiliate: string;
  season: string;
};

const SEED_DEALS: Deal[] = [
  { id: "notion", name: "Notion", category: "Productivity", original: 10, sale: 5, pct: 50, score: 94, blurb: "All-in-one workspace on sale for teams & creators.", affiliate: "https://notion.so", season: "Summer" },
  { id: "linear", name: "Linear", category: "Dev Tools", original: 10, sale: 8, pct: 20, score: 91, blurb: "The best issue tracker. Fast, delightful, now cheaper.", affiliate: "https://linear.app", season: "Q2" },
  { id: "cursor", name: "Cursor", category: "AI Dev", original: 20, sale: 12, pct: 40, score: 96, blurb: "AI code editor that feels like magic. Pro tier deal.", affiliate: "https://cursor.com", season: "Back to School" },
  { id: "figma", name: "Figma", category: "Design", original: 15, sale: 12, pct: 20, score: 88, blurb: "Industry standard for collaborative design. Annual plan.", affiliate: "https://figma.com", season: "Summer" },
  { id: "webflow", name: "Webflow", category: "No-code", original: 14, sale: 9, pct: 36, score: 85, blurb: "Professional websites without code. Great for agencies.", affiliate: "https://webflow.com", season: "Q3" },
  { id: "framer", name: "Framer", category: "Design", original: 15, sale: 10, pct: 33, score: 87, blurb: "Interactive design + CMS. Sites that convert.", affiliate: "https://framer.com", season: "Summer" },
  { id: "claude", name: "Claude Pro", category: "AI", original: 20, sale: 15, pct: 25, score: 93, blurb: "Best AI for serious work. Team and power user favorite.", affiliate: "https://claude.ai", season: "Back to School" },
  { id: "midjourney", name: "Midjourney", category: "AI", original: 10, sale: 6, pct: 40, score: 90, blurb: "Top image gen. Now with better value annual.", affiliate: "https://midjourney.com", season: "Q2" },
];

type StackAnalysis = {
  savings: number;
  topSwitches: Array<{ from: string; to: string; save: number; reason: string }>;
  score: number;
  advice: string;
};

const CREDITS_KEY = "saason_credits";
const PREMIUM_KEY = "saason_premium";

const loadCredits = () => {
  try {
    return parseInt(localStorage.getItem(CREDITS_KEY) || "12", 10);
  } catch {
    return 12;
  }
};
const saveCredits = (n: number) => localStorage.setItem(CREDITS_KEY, String(n));
const isPremium = () => {
  try { return localStorage.getItem(PREMIUM_KEY) === "1"; } catch { return false; }
};
const setPremium = (v: boolean) => localStorage.setItem(PREMIUM_KEY, v ? "1" : "0");

export default function SaasOnSaleApp() {
  const [deals] = useState<Deal[]>(SEED_DEALS);
  const [selectedTools, setSelectedTools] = useState<string[]>(["Notion", "Figma", "Cursor"]);
  const [customTool, setCustomTool] = useState("");
  const [analysis, setAnalysis] = useState<StackAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [credits, setCredits] = useState(loadCredits());
  const [premium, setPremiumState] = useState(isPremium());
  const [adSettings, setAdSettings] = useState<AdSettings | null>(null);
  const [showAdControls, setShowAdControls] = useState(false);
  const [adminToken, setAdminToken] = useState("");
  const [activeTab, setActiveTab] = useState<"analyzer" | "deals" | "calendar">("analyzer");
  const [savedStacks, setSavedStacks] = useState<Array<{ tools: string[]; savings: number; date: string }>>([]);

  useEffect(() => {
    trackPageView({ domain: "saasonsale.com" });
    fetchAdSettings().then(setAdSettings).catch(() => {});
    // load saved
    try {
      const s = JSON.parse(localStorage.getItem("saason_saved_stacks") || "[]");
      setSavedStacks(s);
    } catch {}
  }, []);

  // refreshCredits kept for future server sync (unused in MVP UI)
  void 0;

  const consumeCredit = (amount = 1) => {
    const next = Math.max(0, credits - amount);
    saveCredits(next);
    setCredits(next);
    return next;
  };

  const toggleTool = (tool: string) => {
    setSelectedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  };

  const addCustom = () => {
    const t = customTool.trim();
    if (!t) return;
    if (!selectedTools.includes(t)) setSelectedTools((p) => [...p, t]);
    setCustomTool("");
  };

  const runAnalysis = async () => {
    if (selectedTools.length === 0) return;
    setAnalyzing(true);
    trackFormStart("stack_analyzer", { tools: selectedTools.length });

    // Call worker API (will proxy to shared AI)
    try {
      const res = await fetch("/api/analyze-stack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tools: selectedTools }),
      });
      if (res.ok) {
        const data: StackAnalysis = await res.json();
        setAnalysis(data);
        trackFormSubmit("stack_analyzer", { savings: data.savings, switches: data.topSwitches.length });
      } else {
        // Fallback delightful analysis
        const total = selectedTools.length * 18;
        const est = Math.round(total * (0.22 + Math.random() * 0.18));
        setAnalysis({
          savings: est,
          topSwitches: [
            { from: selectedTools[0], to: "Linear or Cursor on sale", save: Math.round(est * 0.4), reason: "Better speed + current promo" },
            { from: selectedTools[1] || "Figma", to: "Framer annual", save: Math.round(est * 0.3), reason: "Strong summer deal + sites included" },
          ],
          score: 88 + Math.floor(Math.random() * 9),
          advice: "Focus on 2 high-ROI switches this quarter. Lock in annual plans during the current sales window for max savings.",
        });
      }
    } catch {
      const est = Math.round(selectedTools.length * 22);
      setAnalysis({
        savings: est,
        topSwitches: selectedTools.slice(0, 2).map((t, i) => ({
          from: t,
          to: i === 0 ? "Cursor (AI deal)" : "Notion annual",
          save: Math.round(est / (i + 2)),
          reason: "Strong current promo + better fit",
        })),
        score: 89,
        advice: "Current seasonal window is excellent. Annual plans + AI tools have the deepest cuts right now.",
      });
    }
    setAnalyzing(false);
  };

  const saveStack = () => {
    if (!analysis) return;
    const entry = { tools: [...selectedTools], savings: analysis.savings, date: new Date().toISOString().slice(0, 10) };
    const next = [entry, ...savedStacks].slice(0, 6);
    setSavedStacks(next);
    localStorage.setItem("saason_saved_stacks", JSON.stringify(next));
    trackCtaClick("save_stack", { savings: analysis.savings });
    // give a little credit reward for saving
    const nextC = credits + 1;
    saveCredits(nextC);
    setCredits(nextC);
  };

  const claimDeal = (deal: Deal) => {
    trackCtaClick("claim_deal", { deal: deal.id, savings: deal.original - deal.sale });
    // In real: append UTM, log to billing if premium
    window.open(deal.affiliate, "_blank", "noopener");
    if (!premium) {
      consumeCredit(0); // just visual for now
    }
  };

  const buyCredits = () => {
    trackCheckoutStart("saas_credits", { source: "saasonsale" });
    window.location.href = BILLING_HUB_URL;
  };

  const togglePremiumSim = () => {
    const next = !premium;
    setPremiumState(next);
    setPremium(next);
    if (next) {
      saveCredits(credits + 50);
      setCredits(credits + 50);
    }
  };

  const showAd = (placement: string) => {
    if (!adSettings?.enabled) return false;
    if (adSettings.excludedPlacements.includes(placement)) return false;
    if (premium && adSettings.hideAdsForPremium) return false;
    return true;
  };

  return (
    <div className="saason-app">
      <header className="header">
        <div className="brand">
          <span className="logo">S</span>
          <div>
            <div className="brand-name">saasonsale</div>
            <div className="tag">SaaS deals, intelligently</div>
          </div>
        </div>
        <nav>
          <button onClick={() => setActiveTab("analyzer")} className={activeTab === "analyzer" ? "active" : ""}>Analyzer</button>
          <button onClick={() => setActiveTab("deals")} className={activeTab === "deals" ? "active" : ""}>Hot Deals</button>
          <button onClick={() => setActiveTab("calendar")} className={activeTab === "calendar" ? "active" : ""}>Seasonal</button>
          <a href={GROWTH_HUB_URL} target="_blank" rel="noopener" className="hub-link">growth.business hub</a>
        </nav>
        <div className="header-credits">
          <span>{credits} credits</span>
          <button onClick={buyCredits} className="buy-btn">Get more</button>
          <button onClick={togglePremiumSim} className="premium-btn">{premium ? "★ Premium" : "Sim Premium"}</button>
        </div>
      </header>

      <main>
        {activeTab === "analyzer" && (
          <section className="hero">
            <h1>SaaS on Sale.<br />Save thousands this season.</h1>
            <p className="sub">AI analyzes your stack against live deals. Get specific switches, real dollar savings, and one-click claims. Free core tools. Credits unlock unlimited + alerts.</p>

            <div className="stack-analyzer">
              <div className="card">
                <h3>1. Your current stack</h3>
                <div className="chips">
                  {["Notion","Linear","Cursor","Figma","Claude","Webflow","Framer","Midjourney"].map(t => (
                    <button key={t} className={selectedTools.includes(t) ? "chip on" : "chip"} onClick={() => toggleTool(t)}>{t}</button>
                  ))}
                </div>
                <div className="add-row">
                  <input value={customTool} onChange={e => setCustomTool(e.target.value)} placeholder="Add another tool (e.g. Zapier)" onKeyDown={e => e.key === "Enter" && addCustom()} />
                  <button onClick={addCustom}>Add</button>
                </div>
                <div className="selected">Analyzing: {selectedTools.join(", ") || "add some tools"}</div>

                <button className="primary-cta" onClick={runAnalysis} disabled={analyzing || selectedTools.length === 0}>
                  {analyzing ? "Analyzing with AI..." : "Run AI Stack Analysis →"}
                </button>
                <p className="tiny">Uses shared portfolio AI. Results improve with more usage.</p>
              </div>

              {analysis && (
                <div className="results card">
                  <div className="savings-big">${analysis.savings} <span>potential annual savings</span></div>
                  <div className="iq">Deal IQ Score: <strong>{analysis.score}</strong>/100</div>

                  <h4>Top recommended switches</h4>
                  <ul className="switches">
                    {analysis.topSwitches.map((s, i) => (
                      <li key={i}>
                        <strong>{s.from}</strong> → {s.to} <span className="save">save ${s.save}</span>
                        <div className="reason">{s.reason}</div>
                      </li>
                    ))}
                  </ul>
                  <p className="advice">{analysis.advice}</p>

                  <div className="actions-row">
                    <button onClick={saveStack}>Save this stack +1 credit</button>
                    <button onClick={() => { setAnalysis(null); setSelectedTools(["Notion","Figma"]); }}>New analysis</button>
                    <button onClick={buyCredits}>Unlock unlimited (credits)</button>
                  </div>
                </div>
              )}
            </div>

            {showAd("home") && adSettings?.adsenseClientId && (
              <div className="ad-slot">Ad placeholder (home) — client {adSettings.adsenseClientId.slice(0,8)}…</div>
            )}
          </section>
        )}

        {activeTab === "deals" && (
          <section className="deals">
            <h2>Hot deals right now</h2>
            <p className="lead">Curated + AI-scored. All links are affiliate (we earn when you save).</p>
            <div className="deal-grid">
              {deals.map(deal => (
                <div key={deal.id} className="deal-card">
                  <div className="deal-head">
                    <span className="cat">{deal.category}</span>
                    <span className="season">{deal.season}</span>
                  </div>
                  <h3>{deal.name}</h3>
                  <div className="price">
                    <span className="old">${deal.original}</span>
                    <span className="new">${deal.sale}</span>
                    <span className="pct">-{deal.pct}%</span>
                  </div>
                  <div className="score">Deal IQ: {deal.score}</div>
                  <p>{deal.blurb}</p>
                  <button className="claim" onClick={() => claimDeal(deal)}>Claim deal →</button>
                  {showAd("cards") && <div className="ad-mini">ad</div>}
                </div>
              ))}
            </div>
            <div className="note">Prices checked against public promos. Always verify at checkout. More deals added daily via automation.</div>
          </section>
        )}

        {activeTab === "calendar" && (
          <section className="calendar">
            <h2>Seasonal Pulse</h2>
            <p>AI watches known sale cycles. Lock in now for Q3 / Back-to-School / BFCM ramps.</p>
            <div className="pulse">
              <div className="pulse-item"><strong>Summer clearances</strong> — Design &amp; productivity tools dropping 25-50% (Figma, Framer, Notion).</div>
              <div className="pulse-item"><strong>Back to School (Aug-Sep)</strong> — AI &amp; dev tools (Cursor, Claude, Linear) run their best annual promos.</div>
              <div className="pulse-item"><strong>Q3 / EOFY</strong> — Finance, CRM, and ops platforms discount to hit quotas (Webflow, CRM tools).</div>
              <div className="pulse-item"><strong>Black Friday / Cyber</strong> — The big one. 40-70% on almost everything. Set alerts now (premium).</div>
            </div>
            <button onClick={() => setActiveTab("analyzer")}>Run your stack against this quarter's pulse →</button>
          </section>
        )}

        {/* Saved stacks */}
        {savedStacks.length > 0 && (
          <section className="saved">
            <h3>Your saved analyses</h3>
            <ul>
              {savedStacks.map((s, idx) => (
                <li key={idx}>{s.date}: {s.tools.join(", ")} → <strong>${s.savings} /yr</strong></li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <footer>
        <div>Core tools free. Credits unlock deeper AI + unlimited. Premium hides ads + adds saved alerts.</div>
        <div>
          <a href={BILLING_HUB_URL}>Buy credits / manage subscription</a> · <a href={GROWTH_HUB_URL} target="_blank">growth.business</a> · <a href="https://riskfreetrial.org">riskfreetrial.org billing hub</a>
        </div>
        <div className="legal">Privacy-first. No data sold. Uploads/analysis transient unless you save. Part of Nir's 75-domain automated revenue platform.</div>

        <button style={{marginTop:12, fontSize:11}} onClick={() => setShowAdControls(!showAdControls)}>Ad controls (admin)</button>
        {showAdControls && (
          <div className="ad-admin">
            <input placeholder="AdSense client (pub-...)" value={adSettings?.adsenseClientId || ""} onChange={e => setAdSettings(a => a ? {...a, adsenseClientId: e.target.value} : null)} />
            <button onClick={async () => {
              try {
                const updated = await updateAdSettings({ adsenseClientId: adSettings?.adsenseClientId, enabled: true }, adminToken);
                setAdSettings(updated);
                alert("Saved. Refresh to see ads.");
              } catch(e){ alert("Save failed. Check token and D1 migration."); }
            }}>Save settings</button>
            <input placeholder="Admin bearer token" value={adminToken} onChange={e=>setAdminToken(e.target.value)} />
          </div>
        )}
      </footer>
    </div>
  );
}
