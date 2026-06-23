/**
 * GA4 Analytics — Quizbiz Portfolio Standard Module
 *
 * Drop this file into src/lib/ga4.ts for any Quizbiz domain.
 * Call initGA4() once in main.tsx after mount.
 * Use trackEvent() for all custom events.
 *
 * Standard conversion events across all domains:
 *   cta_click        — any primary CTA button pressed
 *   form_start       — user begins filling a form / wizard
 *   form_complete    — form submitted successfully
 *   credit_purchase  — credit pack purchased
 *   provider_match   — user matched to a provider / lead sent
 */

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

let _initialized = false;

/**
 * Initialize GA4. Call once after DOM is ready.
 * measurementId is the G-XXXXXXXXXX for this domain.
 */
export function initGA4(measurementId: string): void {
  if (_initialized || !measurementId || measurementId === "G-PENDING") return;
  _initialized = true;

  // Inject gtag.js script
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  // Bootstrap dataLayer and gtag
  window.dataLayer = window.dataLayer || [];
  window.gtag = function (...args: unknown[]) {
    window.dataLayer.push(args);
  };

  // Respect GPC / DNT signals
  const privacySignal =
    Boolean((navigator as { globalPrivacyControl?: boolean }).globalPrivacyControl) ||
    navigator.doNotTrack === "1" ||
    navigator.doNotTrack === "yes";

  window.gtag("consent", "default", {
    ad_storage: privacySignal ? "denied" : "granted",
    analytics_storage: privacySignal ? "denied" : "granted",
    ad_user_data: privacySignal ? "denied" : "granted",
    ad_personalization: privacySignal ? "denied" : "granted",
    functionality_storage: "granted",
    security_storage: "granted",
    wait_for_update: 500,
  });

  window.gtag("js", new Date());
  window.gtag("config", measurementId, {
    anonymize_ip: true,
    send_page_view: true,
  });
}

/**
 * Fire a GA4 custom event.
 */
export function trackEvent(
  name: string,
  params?: Record<string, string | number | boolean>
): void {
  if (!_initialized || typeof window.gtag !== "function") return;
  window.gtag("event", name, params ?? {});
}

// ─── Standard Quizbiz Conversion Events ──────────────────────────────────────

/** User clicked a primary CTA button */
export function trackCtaClick(label: string, location?: string): void {
  trackEvent("cta_click", { cta_label: label, cta_location: location ?? "unknown" });
}

/** User started filling a form or wizard */
export function trackFormStart(formName: string): void {
  trackEvent("form_start", { form_name: formName });
}

/** User successfully completed and submitted a form */
export function trackFormComplete(formName: string, value?: number): void {
  trackEvent("form_complete", { form_name: formName, ...(value !== undefined && { value }) });
}

/** User purchased a credit pack */
export function trackCreditPurchase(packName: string, value: number, currency = "USD"): void {
  trackEvent("credit_purchase", { pack_name: packName, value, currency });
}

/** User was matched to a provider / lead sent */
export function trackProviderMatch(category: string, matchCount?: number): void {
  trackEvent("provider_match", { match_category: category, ...(matchCount !== undefined && { match_count: matchCount }) });
}
