type AnalyticsEventName =
	| "page_view"
	| "cta_click"
	| "form_start"
	| "form_complete"
	| "checkout_start"
	| "credit_pack_view"
	| "payment_result";
type AnalyticsMetadataValue = string | number | boolean | null;

type AnalyticsPayload = {
	eventName: AnalyticsEventName;
	ctaId?: string;
	formId?: string;
	path?: string;
	sessionId?: string;
	visitorId?: string;
	metadata?: Record<string, AnalyticsMetadataValue>;
};

const ANALYTICS_ENDPOINT = "/api/analytics/events";
const VISITOR_ID_KEY = "saason-analytics-visitor-id";
const SESSION_ID_KEY = "saason-analytics-session-id";

const truncate = (value: string, maxLength: number) => value.trim().slice(0, maxLength);

const createId = (prefix: string) => {
	const bytes = crypto.getRandomValues(new Uint8Array(12));
	const token = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
	return `${prefix}_${token}`;
};

const readStorage = (kind: "local" | "session") => {
	if (typeof window === "undefined") return null;
	try {
		return kind === "local" ? window.localStorage : window.sessionStorage;
	} catch {
		return null;
	}
};

const getOrCreateId = (kind: "local" | "session", key: string, prefix: string) => {
	const storage = readStorage(kind);
	if (!storage) return createId(prefix);
	const existing = storage.getItem(key);
	if (existing) return existing;
	const next = createId(prefix);
	storage.setItem(key, next);
	return next;
};

const sanitizeMetadata = (metadata?: Record<string, unknown>) => {
	if (!metadata) return undefined;
	const out: Record<string, AnalyticsMetadataValue> = {};
	for (const [key, value] of Object.entries(metadata)) {
		const normalizedKey = truncate(key, 64);
		if (!normalizedKey) continue;
		if (value === null) {
			out[normalizedKey] = null;
			continue;
		}
		switch (typeof value) {
			case "string":
				out[normalizedKey] = truncate(value, 160);
				break;
			case "number":
				if (Number.isFinite(value)) out[normalizedKey] = value;
				break;
			case "boolean":
				out[normalizedKey] = value;
				break;
			default:
				break;
		}
	}
	return Object.keys(out).length ? out : undefined;
};

const sendPayload = (payload: AnalyticsPayload) => {
	const body = JSON.stringify(payload);
	try {
		if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
			const blob = new Blob([body], { type: "application/json" });
			if (navigator.sendBeacon(ANALYTICS_ENDPOINT, blob)) return;
		}
	} catch {
		// Fall through to fetch.
	}

	void fetch(ANALYTICS_ENDPOINT, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body,
		keepalive: true,
		credentials: "same-origin",
	}).catch(() => undefined);
};

export const trackAnalyticsEvent = (input: {
	eventName: AnalyticsEventName;
	ctaId?: string;
	formId?: string;
	path?: string;
	metadata?: Record<string, unknown>;
}) => {
	if (typeof window === "undefined") return;
	const payload: AnalyticsPayload = {
		eventName: input.eventName,
		ctaId: input.ctaId ? truncate(input.ctaId, 96) : undefined,
		formId: input.formId ? truncate(input.formId, 96) : undefined,
		path: input.path ? truncate(input.path, 256) : `${window.location.pathname}${window.location.search || ""}${window.location.hash || ""}`,
		sessionId: getOrCreateId("session", SESSION_ID_KEY, "sess"),
		visitorId: getOrCreateId("local", VISITOR_ID_KEY, "vis"),
		metadata: sanitizeMetadata(input.metadata),
	};
	sendPayload(payload);
};

export const trackCtaClick = (ctaId: string, metadata?: Record<string, unknown>) => {
	trackAnalyticsEvent({ eventName: "cta_click", ctaId, metadata });
};

export const trackFormStart = (formId: string, metadata?: Record<string, unknown>) => {
	trackAnalyticsEvent({ eventName: "form_start", formId, metadata });
};

export const trackPageView = (metadata?: Record<string, unknown>) => {
	const path =
		typeof metadata?.path === "string" && metadata.path.trim()
			? metadata.path.trim()
			: undefined;
	const sanitizedMetadata = metadata ? { ...metadata } : undefined;
	if (sanitizedMetadata && "path" in sanitizedMetadata) delete sanitizedMetadata.path;
	trackAnalyticsEvent({ eventName: "page_view", path, metadata: sanitizedMetadata });
};

export const trackFormComplete = (formId: string, metadata?: Record<string, unknown>) => {
	trackAnalyticsEvent({ eventName: "form_complete", formId, metadata });
};

export const trackFormSubmit = (formId: string, metadata?: Record<string, unknown>) => {
	trackFormComplete(formId, metadata);
};

export const trackCreditPackView = (packId: string, metadata?: Record<string, unknown>) => {
	trackAnalyticsEvent({ eventName: "credit_pack_view", ctaId: packId, metadata });
};

export const trackCheckoutStart = (packId: string, metadata?: Record<string, unknown>) => {
	trackAnalyticsEvent({ eventName: "checkout_start", ctaId: packId, metadata });
};

export const trackPaymentResult = (
	packId: string,
	result: "success" | "error",
	metadata?: Record<string, unknown>,
) => {
	trackAnalyticsEvent({
		eventName: "payment_result",
		ctaId: packId,
		metadata: { ...metadata, result },
	});
};
