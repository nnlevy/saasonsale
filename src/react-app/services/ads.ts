export type AdPlacementConfig = {
	slot: string;
	format?: string;
	responsive?: boolean;
};

export type AdSettings = {
	adsenseClientId: string;
	enabled: boolean;
	hideAdsForPremium: boolean;
	excludedPlacements: string[];
	placements: Record<string, AdPlacementConfig>;
	updatedAt: string;
};

const defaultAdSettings: AdSettings = {
	adsenseClientId: "",
	enabled: false,
	hideAdsForPremium: true,
	excludedPlacements: ["home", "premium"],
	placements: {},
	updatedAt: new Date(0).toISOString(),
};

const parseAdSettings = (payload: unknown): AdSettings => {
	if (!payload || typeof payload !== "object") return defaultAdSettings;
	const raw = payload as Partial<AdSettings>;
	return {
		adsenseClientId: raw.adsenseClientId || "",
		enabled: Boolean(raw.enabled),
		hideAdsForPremium: raw.hideAdsForPremium !== false,
		excludedPlacements: Array.isArray(raw.excludedPlacements)
			? raw.excludedPlacements.filter((item): item is string => typeof item === "string")
			: ["home", "premium"],
		placements:
			raw.placements && typeof raw.placements === "object"
				? (raw.placements as Record<string, AdPlacementConfig>)
				: {},
		updatedAt: raw.updatedAt || defaultAdSettings.updatedAt,
	};
};

export const fetchAdSettings = async (): Promise<AdSettings> => {
	const response = await fetch("/api/ad-settings");
	if (!response.ok) {
		throw new Error(`Unable to load ad settings (${response.status})`);
	}
	const payload = (await response.json()) as unknown;
	return parseAdSettings(payload);
};

export const updateAdSettings = async (
	settings: Partial<AdSettings>,
	adminToken?: string,
): Promise<AdSettings> => {
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};
	if (adminToken?.trim()) {
		headers.Authorization = `Bearer ${adminToken.trim()}`;
	}

	const response = await fetch("/api/ad-settings", {
		method: "PUT",
		headers,
		body: JSON.stringify(settings),
	});
	if (!response.ok) {
		throw new Error(`Unable to save ad settings (${response.status})`);
	}
	const payload = (await response.json()) as unknown;
	return parseAdSettings(payload);
};
