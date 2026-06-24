export type Recommendation = {
	id: string;
	title: string;
	description: string;
	cta: string;
	actionType: "voice-note" | "plan" | "surprise" | "gift";
};

export type RecommendationContext = {
	person: string;
	lastConnected: string;
	gesture: string;
	dayLabel: string;
	timeLabel: string;
	locationLabel?: string;
	weatherLabel?: string;
	giftPreferences?: string;
};

type VoiceNoteContext = {
	person: string;
	moment: string;
	tone: string;
	partnerDetails: string;
};

type CardRequest = {
	occasion: string;
	recipient: string;
	theme: string;
	customMessage: string;
	styleNotes: string;
	// New remix / special modes for Memory Remixer, streak badges, pay-it-forward
	// Note: supports doting-style remixer/payforward/streak modes via CardRequest flags for custom use (e.g. saasonsale "deals journey" summaries from user history, savings streaks, anonymous deal tips). Framework preserved intentionally; product branding sanitized below.
	isRemixJourney?: boolean;
	journeySummary?: string;
	pastMomentsCount?: number;
	isStreakBadge?: boolean;
	streakDays?: number;
	isPayForward?: boolean;
};

type CardResponse = {
	title: string;
	subtitle: string;
	message: string;
	signoff: string;
	backgroundSvg: string;
	mascotSvg: string;
	typography: string;
	fontCssUrl?: string;
	backgroundColor: string;
	overlayColor: string;
};

type ActionRequest = {
	person: string;
	moment: string;
	actionType: Recommendation["actionType"];
	tone: string;
	notes: string;
};

export type ActionGuidance = {
	headline: string;
	steps: string[];
	// Two conversion-optimized options (buttons) the user can apply immediately.
	actions: { label: string; message: string }[];
	// Optional single highest-value clarifying question.
	clarifyingQuestion?: string;
};

type GiftRequest = {
	person: string;
	occasion: string;
	budget: string;
	interests: string;
	timing: string;
	storePreference: string;
};

export type GiftIdea = {
	title: string;
	description: string;
	searchQuery: string;
	cardMessage: string;
	theme: string;
	store: "Etsy" | "Amazon" | "Target";
};

type NurtureChatContext = {
	previousResponse?: string;
	dayLabel?: string;
	timeLabel?: string;
	entryPoint?: string;
	profileSummary?: string;
	appContext?: string;
};

// Important: the browser bundle must not talk to OpenAI directly (keys can’t be kept secret).
// We proxy AI calls through the Worker using its OPENAI_API_KEY secret.
const OPENAI_ORG_ID = import.meta.env.VITE_OPENAI_ORG_ID as string | undefined;
const AI_AVAILABLE = true;

const safeJsonParse = <T,>(value: string): T | null => {
	try {
		return JSON.parse(value) as T;
	} catch (error) {
		console.error("Unable to parse AI response", error);
		return null;
	}
};

const fallbackRecommendations = (context: RecommendationContext): Recommendation[] => {
	const person = context.person || "them";
	const wantsGift = context.gesture.toLowerCase().includes("gift");
	const base = [
		{
			id: "voice-note",
			title: `Record a soft voice note for ${person}`,
			description: `It’s ${context.dayLabel} ${context.timeLabel}. Offer a short, heartfelt update that fits the moment.`,
			cta: `Draft a 45-sec voice note opener`,
			actionType: "voice-note",
		},
		{
			id: "shared-ritual",
			title: "Plan a shared ritual",
			description: `Suggest a 20-minute ritual that matches ${context.gesture || "their"} preference and your next available window.`,
			cta: `Draft a 20-min ritual plan`,
			actionType: "plan",
		},

		{
			id: "surprise",
			title: "Send a small surprise",
			description: `Line up a small treat or digital surprise that feels thoughtful and easy to deliver.`,
			cta: `Write a sweet surprise text`,
			actionType: "surprise",
		},
	] as Recommendation[];
	if (wantsGift) {
		return [
			{
				id: "gift-idea",
				title: `Find a thoughtful gift for ${person}`,
				description: `Use ${context.giftPreferences || "their style and interests"} to narrow down something heartfelt and easy to order.`,
				cta: `Explore gift ideas for ${person}`,
				actionType: "gift",
			},
			...base,
		];
	}
	return base;
};

const toSecondPerson = (value: string) =>
	value
		.replace(/\b(she|he|they)\b/gi, "you")
		.replace(/\b(her|him|them)\b/gi, "you")
		.replace(/\b(hers|his|theirs)\b/gi, "yours");

const ensureSecondPerson = (value: string) =>
	toSecondPerson(value)
		.replace(/\b(she's|he's|they're)\b/gi, "you're")
		.replace(/\b(she has|he has|they have)\b/gi, "you have");

const fallbackVoiceNote = (context: VoiceNoteContext) =>
	`Hey ${context.person || "there"}, you’ve been on my heart all day. ${context.partnerDetails ? `I keep smiling about how ${toSecondPerson(context.partnerDetails)}.` : "I love the way you make ordinary moments feel softer and brighter."} Can we steal a few minutes soon for ${context.tone === "playful" ? "something light and sweet" : "a quiet, cozy catch-up"}?`;

const fallbackActionScript = (request: ActionRequest) => {
	if (request.actionType === "plan") {
		return `Plan a ${request.tone} mini-ritual around "${request.moment}". Open with a warm invitation, offer a simple time window, and end with a tender line. ${request.notes ? `Keep in mind: ${request.notes}.` : ""}`;
	}
	if (request.actionType === "surprise") {
		return `Send a sweet surprise tied to "${request.moment}". Mention one tiny detail they love, and close with a gentle invitation to reply. ${request.notes ? `Personalize with: ${request.notes}.` : ""}`;
	}
	return fallbackVoiceNote({
		person: request.person,
		moment: request.moment,
		tone: request.tone,
		partnerDetails: request.notes,
	});
};

const fallbackActionGuidance = (request: ActionRequest): ActionGuidance => {
	const baseHeadline = `A gentle way to start with ${request.person || "them"}`;
	if (request.actionType === "plan") {
		return {
			headline: baseHeadline,
			steps: [
				"Name the shared moment you want to create.",
				"Offer a simple window of time.",
				"End with a warm, easy yes/no question.",
			],
			actions: [
				{
					label: "Draft a 20-min plan",
					message: `Want to carve out a cozy 20 minutes together for ${request.moment} this week? I can suggest a simple little ritual.`,
				},
				{
					label: "Get 3 ritual ideas",
					message: `I’m craving a little us-time. Want 3 quick ${request.moment}-style ideas we can pick from?`,
				},
			],
			clarifyingQuestion: "Do you want this to feel cozy, playful, or romantic?",
		};
	}
	if (request.actionType === "surprise") {
		return {
			headline: baseHeadline,
			steps: [
				"Pick one small surprise tied to something they love.",
				"Let them know you’re thinking about them.",
				"Invite a quick reply.",
			],
			actions: [
				{
					label: "Write a sweet hint",
					message: "I have a tiny surprise for you later — it made me smile thinking about you. Want a hint?",
				},
				{
					label: "Draft a playful reveal",
					message: "I’m planning a small surprise for you. Do you want it to be sweet, cozy, or mischievous?",
				},
			],
			clarifyingQuestion: "Do you want it delivered in person or by text right now?",
		};
	}
	return {
		headline: baseHeadline,
		steps: [
			"Start with one specific appreciation.",
			"Add one detail that proves you noticed them.",
			"End with an easy yes/no or A/B question.",
		],
		actions: [
			{
				label: "Draft a sweet opener",
				message: `Hey ${request.person || "you"}, I’ve been thinking about you today and smiling. Want to hear why?`,
			},
			{
				label: "Write a 1-line text",
				message: "Thinking of you — want something cozy, playful, or tender from me right now?",
			},
		],
		clarifyingQuestion: "Do you want this to feel playful, thoughtful, or spicy?",
	};
};

const fallbackGiftIdea = (request: GiftRequest): GiftIdea => ({
	title: `A keepsake tied to ${request.occasion || "your time together"}`,
	description: `Look for something cozy and personal that nods to ${request.interests || "a shared memory"} within ${request.budget || "a comfortable"} range.`,
	searchQuery: `${request.interests || "personalized gift"} ${request.occasion || "memory"} ${request.budget || ""}`.trim(),
	cardMessage: `I found something that feels so you — a little keepsake that reminds me of us. I can’t wait to give it to you.`,
	theme: request.interests || "warm memories",
	store: "Etsy",
});

const selectTypography = (styleNotes: string) => {
	const normalized = styleNotes.toLowerCase();
	if (
		normalized.includes("whimsical serif") ||
		normalized.includes("storybook serif")
	) {
		return {
			fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif',
			fontCssUrl:
				"https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&display=swap",
		};
	}
	if (normalized.includes("script") || normalized.includes("hand")) {
		return {
			fontFamily: '"Dancing Script", "Segoe Script", cursive',
			fontCssUrl:
				"https://fonts.googleapis.com/css2?family=Dancing+Script:wght@500;700&display=swap",
		};
	}
	if (normalized.includes("serif") || normalized.includes("classic")) {
		return {
			fontFamily: '"Playfair Display", "Times New Roman", serif',
			fontCssUrl:
				"https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&display=swap",
		};
	}
	if (normalized.includes("mono")) {
		return {
			fontFamily:
				'"SFMono-Regular", "Menlo", "Monaco", "Courier New", monospace',
		};
	}
	if (normalized.includes("bold") || normalized.includes("display")) {
		return {
			fontFamily: '"Poppins", "Avenir Next", "Helvetica Neue", sans-serif',
			fontCssUrl:
				"https://fonts.googleapis.com/css2?family=Poppins:wght@500;700&display=swap",
		};
	}
	if (normalized.includes("sans") || normalized.includes("modern")) {
		return {
			fontFamily: '"Avenir", "Helvetica Neue", Arial, sans-serif',
		};
	}
	return { fontFamily: "Georgia" };
};

const hasNeonStarShapes = (svg: string) =>
	/(class="neon-star"|data-neon-star="true")/i.test(svg);

const appendNeonStarsLayer = (svg: string) => {
	if (!svg.includes("</svg>")) return svg;
	const neonLayer = `
		<g data-neon-star="true" class="neon-star" opacity="0.95">
			<defs>
				<filter id="neonGlow" x="-40%" y="-40%" width="180%" height="180%">
					<feGaussianBlur stdDeviation="4" result="blur" />
					<feMerge>
						<feMergeNode in="blur" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
			</defs>
			<path d="M180 120l14 28 30 4-22 22 6 30-28-15-28 15 6-30-22-22 30-4Z" fill="#47f7ff" stroke="#00d4ff" stroke-width="5" filter="url(#neonGlow)" />
			<path d="M950 190l10 20 22 3-16 16 5 22-21-11-21 11 5-22-16-16 22-3Z" fill="#ff4df8" stroke="#ff00dd" stroke-width="4" filter="url(#neonGlow)" />
			<path d="M1060 560l10 20 22 3-16 16 5 22-21-11-21 11 5-22-16-16 22-3Z" fill="#b5ff44" stroke="#89ff00" stroke-width="4" filter="url(#neonGlow)" />
		</g>
	`;
	return svg.replace("</svg>", `${neonLayer}</svg>`);
};

const normalizeInput = (value: string) => value.trim().toLowerCase();

const includesAny = (value: string, keywords: string[]) =>
	keywords.some((keyword) => value.includes(keyword));

const hashInput = (value: string) => {
	let hash = 0;
	for (let index = 0; index < value.length; index += 1) {
		hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
	}
	return hash;
};

const chooseBySeed = <T,>(seed: string, options: T[]) => {
	if (!options.length) {
		throw new Error("chooseBySeed requires at least one option");
	}
	return options[hashInput(seed) % options.length];
};

const pickMotif = (theme: string, styleNotes: string) => {
	const combined = normalizeInput(`${theme} ${styleNotes}`);
	if (includesAny(combined, ["cat", "kitten", "feline"])) return "cat";
	if (includesAny(combined, ["dog", "puppy", "pup"])) return "dog";
	if (includesAny(combined, ["heart", "love", "romance"])) return "hearts";
	if (includesAny(combined, ["flower", "floral", "garden", "bouquet"]))
		return "flowers";
	if (includesAny(combined, ["stars", "starry", "space", "galaxy", "cosmic"]))
		return "stars";
	if (includesAny(combined, ["ocean", "sea", "coastal", "wave", "beach"]))
		return "ocean";
	if (includesAny(combined, ["sunset", "sunrise", "golden hour", "dusk"]))
		return "sunset";
	if (includesAny(combined, ["coffee", "latte", "cafe", "espresso"]))
		return "coffee";
	if (includesAny(combined, ["music", "melody", "song", "concert"]))
		return "music";
	if (includesAny(combined, ["book", "reading", "library"]))
		return "books";
	return chooseBySeed(combined, [
		"flowers",
		"stars",
		"sunset",
		"music",
		"books",
		"sparkles",
	]);
};

const pickPalette = (theme: string, styleNotes: string) => {
	const combined = normalizeInput(`${theme} ${styleNotes}`);
	if (includesAny(combined, ["sunset", "sunrise", "golden hour", "warm"])) {
		return {
			backgroundStart: "#ffd1b3",
			backgroundEnd: "#ff9ab5",
			primary: "#ff7a59",
			secondary: "#ffb347",
			accent: "#6b4f9c",
		};
	}
	if (includesAny(combined, ["ocean", "sea", "coastal", "wave"])) {
		return {
			backgroundStart: "#c7f0ff",
			backgroundEnd: "#a2c5ff",
			primary: "#2fa9f4",
			secondary: "#7bdff2",
			accent: "#1b5f8f",
		};
	}
	if (includesAny(combined, ["forest", "nature", "botanical", "garden"])) {
		return {
			backgroundStart: "#d7f7e5",
			backgroundEnd: "#b2f0d0",
			primary: "#3bbf77",
			secondary: "#ffd27d",
			accent: "#2f5d3a",
		};
	}
	if (includesAny(combined, ["lavender", "purple", "dreamy"])) {
		return {
			backgroundStart: "#f0dbff",
			backgroundEnd: "#efebff",
			primary: "#9333ea",
			secondary: "#ddb8ff",
			accent: "#7800ce",
		};
	}
	return chooseBySeed(combined, [
		{
			backgroundStart: "#f6f2ff",
			backgroundEnd: "#efebff",
			primary: "#9333ea",
			secondary: "#6cf8bb",
			accent: "#181445",
		},
		{
			backgroundStart: "#f0dbff",
			backgroundEnd: "#fcf8ff",
			primary: "#7800ce",
			secondary: "#ddb8ff",
			accent: "#181445",
		},
		{
			backgroundStart: "#fcf8ff",
			backgroundEnd: "#f6f2ff",
			primary: "#006c49",
			secondary: "#9333ea",
			accent: "#181445",
		},
	]);
};

const buildDecorationLayer = (styleNotes: string, palette: ReturnType<typeof pickPalette>) => {
	const normalized = normalizeInput(styleNotes);
	if (includesAny(normalized, ["confetti", "sprinkles"])) {
		return `
			<g opacity="0.7">
				<circle cx="180" cy="140" r="10" fill="${palette.secondary}" />
				<circle cx="980" cy="640" r="12" fill="${palette.primary}" />
				<circle cx="900" cy="220" r="8" fill="#ddb8ff" />
				<circle cx="320" cy="620" r="12" fill="#9333ea" />
			</g>
		`.trim();
	}
	if (includesAny(normalized, ["stars", "sparkle", "twinkle"])) {
		return `
			<g opacity="0.8" stroke="${palette.accent}" stroke-width="4" stroke-linecap="round">
				<path d="M180 140l10 20 20 10-20 10-10 20-10-20-20-10 20-10Z" fill="${palette.secondary}" />
				<path d="M980 200l8 16 16 8-16 8-8 16-8-16-16-8 16-8Z" fill="${palette.primary}" />
			</g>
		`.trim();
	}
	return "";
};

const buildOccasionNarrativeLayer = (
	theme: string,
	styleNotes: string,
	palette: ReturnType<typeof pickPalette>
) => {
	const combined = normalizeInput(`${theme} ${styleNotes}`);
	if (includesAny(combined, ["love", "romantic", "anniversary"])) {
		return `
			<g opacity="0.8">
				<path d="M360 360c0-46 38-84 84-84 28 0 53 13 68 34 15-21 40-34 68-34 46 0 84 38 84 84 0 74-86 125-152 176-66-51-152-102-152-176Z" fill="${palette.secondary}" />
				<path d="M760 240c0-28 22-50 50-50 16 0 31 8 40 20 9-12 24-20 40-20 28 0 50 22 50 50 0 42-52 76-90 106-38-30-90-64-90-106Z" fill="${palette.primary}" opacity="0.7" />
			</g>
		`.trim();
	}
	if (includesAny(combined, ["celebration", "birthday", "congrat"])) {
		return `
			<g opacity="0.85">
				<rect x="860" y="460" width="26" height="120" rx="12" fill="${palette.primary}" />
				<rect x="904" y="420" width="26" height="160" rx="12" fill="${palette.secondary}" />
				<rect x="948" y="480" width="26" height="100" rx="12" fill="${palette.accent}" />
				<circle cx="874" cy="440" r="16" fill="${palette.secondary}" />
				<circle cx="918" cy="392" r="16" fill="${palette.primary}" />
				<circle cx="962" cy="456" r="16" fill="${palette.secondary}" />
			</g>
		`.trim();
	}
	if (includesAny(combined, ["comfort", "support", "miss", "thinking of"])) {
		return `
			<g opacity="0.78">
				<path d="M130 520c120-88 260-88 380 0" stroke="${palette.secondary}" stroke-width="14" fill="none" />
				<path d="M210 570c100-70 210-70 310 0" stroke="${palette.primary}" stroke-width="10" fill="none" />
			</g>
		`.trim();
	}
	return "";
};

const fallbackCard = (request: CardRequest): CardResponse => {
	const palette = pickPalette(request.theme, request.styleNotes);
	const motif = pickMotif(request.theme, request.styleNotes);
	const typography = selectTypography(request.styleNotes || "");
	const needsNeonStars = includesAny(
		normalizeInput(`${request.theme} ${request.styleNotes}`),
		["neon stars", "neon", "star", "stars", "sparkle"]
	);
	const backgroundSvg = createCardBackgroundSvg(
		request.theme || request.occasion,
		request.styleNotes,
		motif,
		palette
	);
	const normalizedOccasion = request.occasion?.trim().toLowerCase();
	const opening =
		normalizedOccasion === "love"
			? `${request.recipient || "You"}, I feel so much love for you.`
			: `For ${request.recipient || "you"},`;
	let title = `Happy ${request.occasion}!`;
	let subtitle = `For ${request.recipient}`;
	let message = `${opening} ${request.customMessage || "you make everything feel brighter."} Here’s to more celebrations together.`;
	let signoff = "With appreciation,";

	if (request.isRemixJourney) {
		title = "Our Journey";
		subtitle = `Celebrating ${request.recipient}`;
		message = `Based on the cards and moments we've shared before — every small note, every quiet gesture — here is a celebration of our journey. ${request.journeySummary || "Thank you for walking this path with me."} The best is still ahead.`;
		signoff = "Always, us";
	} else if (request.isStreakBadge) {
		const d = request.streakDays || 7;
		title = `${d}-Day Streak`;
		subtitle = "Your savings streak";
		message = `We've shown up for each other ${d} days running. Every deal spotted, every smart save. This streak is ours.`;
		signoff = "Keep choosing us";
	} else if (request.isPayForward) {
		title = "For you, today";
		subtitle = "Someone passed this your way";
		message = "If today feels heavy or ordinary, this is a small reminder: you are seen, and you are not alone. Pass a little warmth forward when you can.";
		signoff = "With quiet care";
	}

	return {
		title,
		subtitle,
		message,
		signoff,
		backgroundSvg: needsNeonStars
			? appendNeonStarsLayer(backgroundSvg)
			: backgroundSvg,
		mascotSvg: createCardMascotSvg(motif, palette),
		typography: typography.fontFamily,
		fontCssUrl: typography.fontCssUrl,
		backgroundColor: palette.backgroundStart,
		overlayColor: "#181445",
	};
};

const createCardBackgroundSvg = (
	theme: string,
	styleNotes: string,
	motif: string,
	palette: ReturnType<typeof pickPalette>
) =>
	`
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" role="img" aria-label="Greeting card background for ${theme}">
			<defs>
				<linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0%" stop-color="${palette.backgroundStart}" />
					<stop offset="100%" stop-color="${palette.backgroundEnd}" />
				</linearGradient>
			</defs>
			<rect width="1200" height="800" rx="48" fill="url(#grad)" />
			<circle cx="150" cy="160" r="90" fill="${palette.secondary}" opacity="0.8" />
			<circle cx="980" cy="140" r="70" fill="${palette.primary}" opacity="0.8" />
			<path d="M120 620c120-90 240-90 360 0" stroke="${palette.primary}" stroke-width="18" fill="none" opacity="0.5" />
			${motif === "cat" ? `<g opacity="0.8">
				<circle cx="950" cy="640" r="36" fill="${palette.secondary}" />
				<circle cx="900" cy="610" r="12" fill="${palette.accent}" />
				<circle cx="980" cy="610" r="12" fill="${palette.accent}" />
				<circle cx="930" cy="675" r="12" fill="${palette.accent}" />
				<circle cx="970" cy="675" r="12" fill="${palette.accent}" />
			</g>` : ""}
			${motif === "flowers" ? `<g opacity="0.85">
				<circle cx="980" cy="600" r="28" fill="${palette.secondary}" />
				<circle cx="1010" cy="600" r="20" fill="${palette.primary}" />
				<circle cx="995" cy="575" r="18" fill="#ffe17d" />
			</g>` : ""}
			${motif === "stars" ? `<g fill="${palette.secondary}">
				<polygon points="180,120 192,150 224,150 198,168 208,198 180,180 152,198 162,168 136,150 168,150" />
				<polygon points="1020,260 1030,285 1056,285 1034,300 1042,326 1020,312 998,326 1006,300 984,285 1010,285" />
			</g>` : ""}
			${motif === "ocean" ? `<path d="M80 560c80-40 160-40 240 0s160 40 240 0 160-40 240 0 160 40 240 0" fill="none" stroke="${palette.secondary}" stroke-width="12" opacity="0.8" />` : ""}
			${motif === "sunset" ? `<g opacity="0.9">
				<circle cx="200" cy="580" r="80" fill="${palette.secondary}" />
				<path d="M80 580h240" stroke="${palette.accent}" stroke-width="10" />
			</g>` : ""}
			${motif === "coffee" ? `<g opacity="0.9">
				<rect x="900" y="540" width="140" height="90" rx="20" fill="${palette.secondary}" />
				<rect x="1010" y="560" width="40" height="50" rx="20" fill="none" stroke="${palette.accent}" stroke-width="10" />
				<path d="M940 520c0-30 20-30 20-60" stroke="${palette.accent}" stroke-width="8" fill="none" />
				<path d="M980 520c0-30 20-30 20-60" stroke="${palette.accent}" stroke-width="8" fill="none" />
			</g>` : ""}
			${motif === "music" ? `<g fill="${palette.accent}" opacity="0.8">
				<path d="M960 540v80c0 22-28 32-44 16-16-16-6-42 24-42 6 0 12 2 20 6v-60l80-18v80c0 22-28 32-44 16-16-16-6-42 24-42 6 0 12 2 20 6v-68l-80 18Z" />
			</g>` : ""}
			${motif === "books" ? `<g opacity="0.85">
				<rect x="900" y="520" width="180" height="120" rx="16" fill="${palette.secondary}" />
				<rect x="920" y="540" width="140" height="16" fill="${palette.primary}" />
				<rect x="920" y="570" width="120" height="12" fill="${palette.accent}" />
			</g>` : ""}
			${buildDecorationLayer(styleNotes, palette)}
			${buildOccasionNarrativeLayer(theme, styleNotes, palette)}
		</svg>
	`.trim();

const createCardMascotSvg = (
	motif: string,
	palette: ReturnType<typeof pickPalette>
) =>
	`
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 360" role="img" aria-label="Greeting card mascot">
			${motif === "cat" ? `
				<circle cx="180" cy="190" r="110" fill="${palette.primary}" />
				<polygon points="110,120 150,80 160,140" fill="${palette.primary}" />
				<polygon points="250,120 210,80 200,140" fill="${palette.primary}" />
				<circle cx="140" cy="190" r="34" fill="#ffffff" />
				<circle cx="220" cy="190" r="34" fill="#ffffff" />
				<circle cx="140" cy="190" r="12" fill="${palette.accent}" />
				<circle cx="220" cy="190" r="12" fill="${palette.accent}" />
				<polygon points="180,210 165,235 195,235" fill="${palette.secondary}" />
				<path d="M120 230c20 10 40 10 60 0" stroke="${palette.accent}" stroke-width="8" fill="none" stroke-linecap="round" />
				<path d="M200 230c20 10 40 10 60 0" stroke="${palette.accent}" stroke-width="8" fill="none" stroke-linecap="round" />
			` : ""}
			${motif === "dog" ? `
				<circle cx="180" cy="190" r="110" fill="${palette.primary}" />
				<ellipse cx="90" cy="190" rx="30" ry="60" fill="${palette.secondary}" />
				<ellipse cx="270" cy="190" rx="30" ry="60" fill="${palette.secondary}" />
				<circle cx="140" cy="190" r="30" fill="#ffffff" />
				<circle cx="220" cy="190" r="30" fill="#ffffff" />
				<circle cx="140" cy="190" r="12" fill="${palette.accent}" />
				<circle cx="220" cy="190" r="12" fill="${palette.accent}" />
				<circle cx="180" cy="230" r="18" fill="${palette.accent}" />
				<path d="M150 250c20 14 40 14 60 0" stroke="${palette.accent}" stroke-width="8" fill="none" stroke-linecap="round" />
			` : ""}
			${motif === "flowers" ? `
				<circle cx="180" cy="190" r="60" fill="${palette.secondary}" />
				${[0, 60, 120, 180, 240, 300]
					.map(
						(angle) =>
							`<circle cx="${180 + 90 * Math.cos((angle * Math.PI) / 180)}" cy="${190 + 90 * Math.sin((angle * Math.PI) / 180)}" r="44" fill="${palette.primary}" />`
					)
					.join("")}
				<circle cx="180" cy="190" r="24" fill="#ffe17d" />
				<circle cx="160" cy="185" r="6" fill="${palette.accent}" />
				<circle cx="200" cy="185" r="6" fill="${palette.accent}" />
				<path d="M165 215c10 8 20 8 30 0" stroke="${palette.accent}" stroke-width="6" fill="none" stroke-linecap="round" />
			` : ""}
			${motif === "stars" ? `
				<circle cx="180" cy="190" r="90" fill="${palette.primary}" />
				<polygon points="180,90 195,135 242,135 204,162 218,208 180,180 142,208 156,162 118,135 165,135" fill="${palette.secondary}" />
				<circle cx="150" cy="190" r="12" fill="#ffffff" />
				<circle cx="210" cy="190" r="12" fill="#ffffff" />
				<circle cx="150" cy="190" r="5" fill="${palette.accent}" />
				<circle cx="210" cy="190" r="5" fill="${palette.accent}" />
				<path d="M160 220c14 10 26 10 40 0" stroke="${palette.accent}" stroke-width="6" fill="none" stroke-linecap="round" />
			` : ""}
			${motif === "ocean" ? `
				<circle cx="180" cy="190" r="90" fill="${palette.primary}" />
				<path d="M120 190c20-16 40-16 60 0s40 16 60 0" fill="none" stroke="${palette.secondary}" stroke-width="12" />
				<circle cx="150" cy="170" r="12" fill="#ffffff" />
				<circle cx="210" cy="170" r="12" fill="#ffffff" />
				<circle cx="150" cy="170" r="5" fill="${palette.accent}" />
				<circle cx="210" cy="170" r="5" fill="${palette.accent}" />
				<path d="M160 210c14 10 26 10 40 0" stroke="${palette.accent}" stroke-width="6" fill="none" stroke-linecap="round" />
			` : ""}
			${motif === "sunset" ? `
				<circle cx="180" cy="190" r="90" fill="${palette.primary}" />
				<circle cx="180" cy="190" r="50" fill="${palette.secondary}" />
				<circle cx="150" cy="180" r="12" fill="#ffffff" />
				<circle cx="210" cy="180" r="12" fill="#ffffff" />
				<circle cx="150" cy="180" r="5" fill="${palette.accent}" />
				<circle cx="210" cy="180" r="5" fill="${palette.accent}" />
				<path d="M160 220c14 10 26 10 40 0" stroke="${palette.accent}" stroke-width="6" fill="none" stroke-linecap="round" />
			` : ""}
			${motif === "coffee" ? `
				<circle cx="180" cy="190" r="90" fill="${palette.primary}" />
				<rect x="120" y="190" width="120" height="70" rx="18" fill="${palette.secondary}" />
				<rect x="220" y="200" width="40" height="40" rx="18" fill="none" stroke="${palette.accent}" stroke-width="8" />
				<path d="M150 170c0-20 14-20 14-40" stroke="${palette.accent}" stroke-width="6" fill="none" />
				<path d="M190 170c0-20 14-20 14-40" stroke="${palette.accent}" stroke-width="6" fill="none" />
				<circle cx="150" cy="150" r="10" fill="#ffffff" />
				<circle cx="210" cy="150" r="10" fill="#ffffff" />
				<circle cx="150" cy="150" r="4" fill="${palette.accent}" />
				<circle cx="210" cy="150" r="4" fill="${palette.accent}" />
				<path d="M160 230c14 10 26 10 40 0" stroke="${palette.accent}" stroke-width="6" fill="none" stroke-linecap="round" />
			` : ""}
			${motif === "music" ? `
				<circle cx="180" cy="190" r="90" fill="${palette.primary}" />
				<path d="M200 120v90c0 16-20 24-32 12-12-12-4-30 18-30 4 0 8 1 14 4v-66l56-12v70c0 16-20 24-32 12-12-12-4-30 18-30 4 0 8 1 14 4v-58l-56 12Z" fill="${palette.secondary}" />
				<circle cx="150" cy="190" r="10" fill="#ffffff" />
				<circle cx="210" cy="190" r="10" fill="#ffffff" />
				<circle cx="150" cy="190" r="4" fill="${palette.accent}" />
				<circle cx="210" cy="190" r="4" fill="${palette.accent}" />
				<path d="M160 220c14 10 26 10 40 0" stroke="${palette.accent}" stroke-width="6" fill="none" stroke-linecap="round" />
			` : ""}
			${motif === "books" ? `
				<circle cx="180" cy="190" r="90" fill="${palette.primary}" />
				<rect x="130" y="160" width="100" height="60" rx="8" fill="${palette.secondary}" />
				<rect x="140" y="170" width="80" height="10" fill="${palette.accent}" />
				<circle cx="155" cy="150" r="10" fill="#ffffff" />
				<circle cx="205" cy="150" r="10" fill="#ffffff" />
				<circle cx="155" cy="150" r="4" fill="${palette.accent}" />
				<circle cx="205" cy="150" r="4" fill="${palette.accent}" />
				<path d="M160 210c14 10 26 10 40 0" stroke="${palette.accent}" stroke-width="6" fill="none" stroke-linecap="round" />
			` : ""}
				${motif === "hearts" ? `
				<circle cx="180" cy="180" r="120" fill="${palette.primary}" />
				<circle cx="120" cy="210" r="16" fill="${palette.secondary}" opacity="0.7" />
				<circle cx="240" cy="210" r="16" fill="${palette.secondary}" opacity="0.7" />
				<circle cx="140" cy="170" r="38" fill="#ffffff" />
				<circle cx="220" cy="170" r="38" fill="#ffffff" />
				<circle cx="140" cy="170" r="14" fill="${palette.accent}" />
				<circle cx="220" cy="170" r="14" fill="${palette.accent}" />
				<polygon points="180,210 160,250 200,250" fill="${palette.secondary}" />
				<path d="M130 270c30 18 70 18 100 0" stroke="${palette.accent}" stroke-width="10" fill="none" stroke-linecap="round" />
				<path d="M70 90c20-30 40-46 60-46" stroke="${palette.accent}" stroke-width="10" fill="none" stroke-linecap="round" />
				<path d="M290 90c-20-30-40-46-60-46" stroke="${palette.accent}" stroke-width="10" fill="none" stroke-linecap="round" />
				` : ""}
				${motif === "sparkles" ? `
					<g opacity="0.95">
						<path d="M180 90l18 36 36 6-26 26 8 36-36-19-36 19 8-36-26-26 36-6Z" fill="${palette.secondary}" />
						<circle cx="140" cy="210" r="12" fill="#ffffff" />
						<circle cx="220" cy="210" r="12" fill="#ffffff" />
						<circle cx="140" cy="210" r="5" fill="${palette.accent}" />
						<circle cx="220" cy="210" r="5" fill="${palette.accent}" />
						<path d="M160 242c14 10 26 10 40 0" stroke="${palette.accent}" stroke-width="6" fill="none" stroke-linecap="round" />
						<path d="M88 248l10 20 20 10-20 10-10 20-10-20-20-10 20-10Z" fill="${palette.primary}" />
						<path d="M272 248l10 20 20 10-20 10-10 20-10-20-20-10 20-10Z" fill="${palette.primary}" />
					</g>
				` : ""}
			</svg>
		`.trim();

const hasVectorShapes = (svg: string) =>
	/(<circle\b|<rect\b|<path\b|<polygon\b|<ellipse\b|<line\b|<polyline\b)/i.test(
		svg
	);

const ensureIllustratedCard = (
	parsed: CardResponse,
	request: CardRequest
): CardResponse => {
	const palette = pickPalette(request.theme, request.styleNotes);
	const motif = pickMotif(request.theme, request.styleNotes);
	const typography = selectTypography(request.styleNotes || "");
	const needsNeonStars = includesAny(
		normalizeInput(`${request.theme} ${request.styleNotes}`),
		["neon stars", "neon", "star", "stars", "sparkle"]
	);
	const backgroundSvg = hasVectorShapes(parsed.backgroundSvg)
		? parsed.backgroundSvg
		: createCardBackgroundSvg(
				request.theme || request.occasion,
				request.styleNotes,
				motif,
				palette
			);
	const mascotSvg = hasVectorShapes(parsed.mascotSvg)
		? parsed.mascotSvg
		: createCardMascotSvg(motif, palette);
	const normalizedFontCssUrl =
		parsed.fontCssUrl &&
		/^https:\/\/fonts\.(googleapis|gstatic)\.com\//i.test(parsed.fontCssUrl)
			? parsed.fontCssUrl
			: typography.fontCssUrl;
	const normalizedMessage =
		request.occasion.trim().toLowerCase() === "love" &&
		/^happy\s+love!?/i.test(parsed.message || "")
			? `${request.recipient || "You"}, I feel so much love for you. ${request.customMessage || "You make everything feel brighter."} Here’s to more celebrations together.`
			: parsed.message;
	return {
		...parsed,
		title: parsed.title || `Happy ${request.occasion}!`,
		subtitle: parsed.subtitle || `For ${request.recipient}`,
		backgroundSvg:
			needsNeonStars && !hasNeonStarShapes(backgroundSvg)
				? appendNeonStarsLayer(backgroundSvg)
				: backgroundSvg,
		mascotSvg,
		signoff: parsed.signoff || "With appreciation,",
		message: normalizedMessage,
		typography: parsed.typography || typography.fontFamily,
		fontCssUrl: normalizedFontCssUrl,
		backgroundColor: parsed.backgroundColor || palette.backgroundStart,
		overlayColor: parsed.overlayColor || "#2e2d39",
	};
};

export const storeCardConfig = async (card: CardResponse & CardRequest) => {
	const response = await fetch("/api/cards", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(card),
	});
	if (!response.ok) {
		throw new Error("Failed to store card config");
	}
	return (await response.json()) as { id: string; url: string };
};

export const fetchCardConfig = async (cardId: string) => {
	const response = await fetch(`/api/cards/${encodeURIComponent(cardId)}`);
	if (!response.ok) {
		throw new Error("Failed to fetch card config");
	}
	return (await response.json()) as CardResponse & CardRequest;
};

const requestChatCompletion = async (
	prompt: string,
	systemPrompt = "You are a thoughtful relationship coach who replies in concise JSON."
) => {
	const response = await fetch("/api/ai/chat", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...(OPENAI_ORG_ID ? { "X-OpenAI-Organization": "" + OPENAI_ORG_ID } : {}),
		},
		body: JSON.stringify({
			prompt,
			systemPrompt,
			model: "gpt-4o-mini",
			responseFormat: "json_object",
			temperature: 0.5,
		}),
	});
	if (!response.ok) {
		// Fall back gracefully (so UX still works even if the AI endpoint is down).
		return null;
	}
	const data = (await response.json()) as { content?: string };
	return data.content ?? null;
};

const normalizeText = (s: string) => (s || "").trim();

const extractWeekday = (s: string) => {
	const m = (s || "").match(
		/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i
	);
	return m?.[1]?.toLowerCase() ?? null;
};

const looksVague = (s: string) => {
	const t = (s || "").toLowerCase();
	return (
		t.includes("open to suggestions") ||
		t.includes("something together") ||
		t.includes("activity together") ||
		t.includes("spending quality time")
	);
};

const validateRecommendations = (
	recs: Recommendation[],
	context: RecommendationContext
): { ok: true; value: Recommendation[] } | { ok: false; reason: string } => {
	if (!Array.isArray(recs) || recs.length < 1) {
		return { ok: false, reason: "No recommendations returned." };
	}
	const day = normalizeText(context.dayLabel);
	const expectedWeekday = extractWeekday(day);

	for (const r of recs) {
		if (!r || typeof r !== "object") {
			return { ok: false, reason: "Recommendation item is not an object." };
		}
		if (!normalizeText(r.id) || !normalizeText(r.title) || !normalizeText(r.description) || !normalizeText(r.cta)) {
			return { ok: false, reason: "Missing required fields (id/title/description/cta)." };
		}
		if (!r.actionType || !["voice-note", "plan", "surprise", "gift"].includes(r.actionType)) {
			return { ok: false, reason: `Invalid actionType: ${String(r.actionType)}` };
		}

		// Prevent day/time drift like the screenshot: card says Wednesday, CTA says Sunday.
		const combined = `${r.title} ${r.description} ${r.cta}`;
		const foundWeekday = extractWeekday(combined);
		if (expectedWeekday && foundWeekday && expectedWeekday !== foundWeekday) {
			return {
				ok: false,
				reason: `Context drift: expected weekday "${expectedWeekday}" from context.dayLabel="${day}", but found "${foundWeekday}" in output.`,
			};
		}

		// If the model uses a generic phrase, CTA must still promise an immediate benefit.
		if (looksVague(r.title) || looksVague(r.description)) {
			const cta = r.cta.toLowerCase();
			const benefitWords = ["plan", "ideas", "options", "draft", "script", "steps", "checklist", "menu"];
			if (!benefitWords.some((w) => cta.includes(w))) {
				return {
					ok: false,
					reason: `CTA too vague for a vague card. CTA must promise a concrete output (plan/ideas/options/draft/steps). Got cta="${r.cta}"`,
				};
			}
		}

		// Keep CTAs short-ish so they fit buttons.
		if (r.cta.length > 80) {
			return { ok: false, reason: `CTA too long (${r.cta.length} chars).` };
		}
	}

	// Nudge variety: don't allow all four to be the same action type.
	const types = new Set(recs.map((r) => r.actionType));
	if (types.size < 2 && recs.length >= 3) {
		return { ok: false, reason: "Not enough variety in actionType." };
	}

	return { ok: true, value: recs };
};

export const fetchRecommendations = async (
	context: RecommendationContext
): Promise<Recommendation[]> => {
	if (!AI_AVAILABLE) {
		return fallbackRecommendations(context);
	}

	const systemPrompt =
		"You are a thoughtful relationship coach. You MUST reply with valid JSON only. Never include extra keys. Never mention a different day/time than the provided context. CTAs must be short and clearly state the immediate benefit/output.";

	const prompt = `Return JSON with an array named recommendations.

Schema:
{
  "recommendations": [
    {
      "id": "string",
      "title": "string (3-7 words)",
      "description": "string (1-2 sentences, specific)",
      "cta": "string (button label; short; promises an output like a plan/ideas/draft/steps)",
      "actionType": "voice-note" | "plan" | "surprise" | "gift"
    }
  ]
}

Hard rules:
- Use this exact context and DO NOT introduce a different day/time:
  dayLabel="${context.dayLabel}", timeLabel="${context.timeLabel}".
- If you mention a weekday, it must match dayLabel.
- Make each recommendation concrete and distinct.
- If you use a broad theme (e.g. "open to suggestions"), the CTA must be explicit about what the app will generate next (e.g. "Get 5 ideas", "Draft a 20-min ritual plan").

Context:
person=${context.person}
lastConnected=${context.lastConnected}
gesture=${context.gesture}
day=${context.dayLabel}
time=${context.timeLabel}
location=${context.locationLabel || "unknown"}
weather=${context.weatherLabel || "unknown"}
giftPreferences=${context.giftPreferences || "none"}

If gesture mentions gifts, include at least one gift actionType.`;

	const attempt = async (extraUserNote?: string) => {
		const content = await requestChatCompletion(
			extraUserNote ? `${prompt}\n\nFix note: ${extraUserNote}` : prompt,
			systemPrompt
		);
		const parsed = content
			? safeJsonParse<{ recommendations: Recommendation[] }>(content)
			: null;
		return parsed?.recommendations ?? null;
	};

	try {
		const first = await attempt();
		if (!first) {
			return fallbackRecommendations(context);
		}
		const v1 = validateRecommendations(first, context);
		if (v1.ok) {
			return v1.value;
		}

		// One repair pass with a precise error message.
		const repaired = await attempt(v1.reason);
		if (!repaired) {
			return fallbackRecommendations(context);
		}
		const v2 = validateRecommendations(repaired, context);
		if (v2.ok) {
			return v2.value;
		}

		return fallbackRecommendations(context);
	} catch (error) {
		console.error("AI recommendation error", error);
		return fallbackRecommendations(context);
	}
};

export const generateVoiceNoteScript = async (
	context: VoiceNoteContext
): Promise<string> => {
	if (!AI_AVAILABLE) {
		return fallbackVoiceNote(context);
	}
	const prompt = `Return JSON with key script. Write a short, poetic ${context.tone} voice note opener for ${context.person} about ${context.moment}. Use second-person language ("you/your") to address them. If any detail is in third-person, rewrite it into second-person. Avoid formal phrasing like "check-in"; keep it sincere and familiar. Include details: ${context.partnerDetails || "none"}. Keep it under 60 words.`;
	try {
		const content = await requestChatCompletion(prompt);
		const parsed = content
			? safeJsonParse<{ script: string }>(content)
			: null;
		return ensureSecondPerson(parsed?.script || fallbackVoiceNote(context));
	} catch (error) {
		console.error("AI voice note error", error);
		return fallbackVoiceNote(context);
	}
};

export const generateRecommendationAction = async (
	request: ActionRequest
): Promise<string> => {
	if (!AI_AVAILABLE) {
		return fallbackActionScript(request);
	}
	const prompt = `Return JSON with key script. Write a ${request.tone}, poetic starting point for a ${request.actionType} about "${request.moment}" for ${request.person}. Use second-person language ("you/your") to address them and rewrite any third-person detail into second-person. Keep it under 80 words, be romantic or tender, and avoid blunt phrasing like "my wife" or "my husband". Avoid formal words like "check-in"; keep it sincere and familiar. Include details: ${request.notes || "none"}.`;
	try {
		const content = await requestChatCompletion(prompt);
		const parsed = content
			? safeJsonParse<{ script: string }>(content)
			: null;
		return ensureSecondPerson(parsed?.script || fallbackActionScript(request));
	} catch (error) {
		console.error("AI action script error", error);
		return fallbackActionScript(request);
	}
};

export const generateActionGuidance = async (
	request: ActionRequest
): Promise<ActionGuidance> => {
	if (!AI_AVAILABLE) {
		return fallbackActionGuidance(request);
	}
	const prompt = `Return JSON with keys:
- headline (string)
- steps (array of 2-3 short bullets)
- actions (array of exactly 2 objects with label and message)
- clarifyingQuestion (string)

This is guidance for a ${request.actionType} about "${request.moment}" for ${request.person}.

Rules:
- Use second-person language ("you/your").
- Avoid formal words like "check-in".
- Each actions[i].label must read like an immediate benefit (e.g. "Draft a 20-min plan", "Get 3 ideas", "Write a sweet opener"). Keep labels <= 32 chars.
- Each actions[i].message should be a short starter message that helps carry out the gesture.
- clarifyingQuestion: ask the single highest-leverage question that would meaningfully personalize the next draft (one sentence).`;
	try {
		const content = await requestChatCompletion(prompt);
		const parsed = content ? safeJsonParse<ActionGuidance>(content) : null;
		if (!parsed?.actions?.length) {
			return fallbackActionGuidance(request);
		}
		return {
			headline: parsed.headline || `A gentle way to start with ${request.person || "them"}`,
			steps: parsed.steps?.length ? parsed.steps : fallbackActionGuidance(request).steps,
			actions: parsed.actions.map((action) => ({
				label: action.label,
				message: ensureSecondPerson(action.message || ""),
			})),
			clarifyingQuestion: parsed.clarifyingQuestion,
		};
	} catch (error) {
		console.error("AI guidance error", error);
		return fallbackActionGuidance(request);
	}
};
export const generateNurtureChatResponse = async (
	userPrompt: string,
	context: NurtureChatContext = {}
): Promise<string> => {
	if (!AI_AVAILABLE) {
		const promptHint = userPrompt.trim().replace(/\s+/g, " ").slice(0, 140);
		const when = [context.dayLabel, context.timeLabel].filter(Boolean).join(" ").trim();
		const moment = when ? `(${when})` : "";
		// Deterministic-ish variation: keeps it feeling dynamic even without an API key.
		const seed = Array.from(`${promptHint}|${when}|${new Date().toDateString()}`).reduce(
			(acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0,
			7,
		);
		const variants = [
			`You’re in "${promptHint}" ${moment}. Send a 1‑sentence text that names one specific thing you appreciate about them right now, then ask a tiny yes/no question that makes reconnecting easy (e.g., “Want me to grab you water/coffee when we land?”).`,
			`Tie it to "${promptHint}" ${moment}: send a quick voice note opener that starts with one sensory detail (what you see/hear), then one warm line about them, then a simple plan for the next 10 minutes.`,
			`Use "${promptHint}" ${moment} as your anchor: send a photo of what you’re seeing + one line that makes them feel chosen (“I’m thinking of you in this moment”), then propose one small ritual for later (5 minutes). For credits or business questions: you get 10 to start, 1 per card; works for client notes with Professional tone. See https://growth.business for packs and more tools.`,
		];
		return variants[seed % variants.length];
	}
	const lowerPrompt = userPrompt.toLowerCase();
	const isMetaQuestion =
		/credit|price|cost|pricing|subscription|how many|how does it work|business|client|small business|sbo|for work|for customers|professional use/.test(lowerPrompt) ||
		/\b(what|how|is there|can i)\b.*(credit|price|cost|plan|business|client)/.test(lowerPrompt);

	if (isMetaQuestion) {
		// Honest, direct answers for SBOs and transparency. Never dodge.
		return "You start with 10 local credits (FREE_CARD_LIMIT of 3 free cards tracked separately). Creating a card or major AI action costs 1 credit — visible in the toll/credit pill, changes animate. Transparent packs at growth.business (e.g. starter boosts). Works excellently for deal hunters and small business owners: use the Professional tone for specific client thank-yous after jobs or referrals (e.g. 'Thank you for choosing Alex's Home Services...'). No generic fluff. Visit the growth.business hub for more SBO tools: https://growth.business . If you want, tell me the client name + occasion and I'll help draft one.";
	}

	const systemPrompt =
		"You are a helpful seasonal deals and savings coach for SaasonSale, a product that helps users discover hot seasonal deals, smart magnesium and supplement stacks, and value buys through analyzers, calendars, and cards. Respond in 2-3 practical sentences, include one specific deal or savings idea, and suggest a near-term action to save or share. Keep the tone friendly and direct, avoid the word 'check-in', and give a fresh idea each time (do not mirror the exact wording from the user). Use provided app/profile context to personalize without exposing private data verbatim. Support special card modes (remixer for user's deals journey, streak badges for savings habits, pay-it-forward anonymous tips) when flags set.";
	const prompt = [
		`User request: ${userPrompt}`,
		context.entryPoint ? `UI location: ${context.entryPoint}` : "",
		context.appContext ? `App context: ${context.appContext}` : "",
		context.profileSummary ? `User profile context: ${context.profileSummary}` : "",
		context.dayLabel || context.timeLabel
			? `Current moment: ${context.dayLabel || "today"} ${context.timeLabel || ""}`.trim()
			: "",
		context.previousResponse
			? `Avoid repeating this prior assistant response: ${context.previousResponse}`
			: "",
		`Variation seed: ${Date.now()}`,
	]
		.filter(Boolean)
		.join("\n");
	try {
		const content = await requestChatCompletion(prompt, systemPrompt);
		return (
			ensureSecondPerson(content?.trim() || "") ||
			"Consider sending a tiny gratitude note and asking for a cozy moment to connect."
		);
	} catch (error) {
		console.error("AI nurture chat error", error);
		return "Consider sending a tiny gratitude note and asking for a cozy moment to connect.";
	}
};

export const generateGiftIdea = async (
	request: GiftRequest
): Promise<GiftIdea> => {
	if (!AI_AVAILABLE) {
		return fallbackGiftIdea(request);
	}
	const prompt = `Return JSON with keys title, description, searchQuery, cardMessage, theme, store. Create one thoughtful gift idea for ${request.person} that fits occasion="${request.occasion || "just because"}", budget="${request.budget || "flexible"}", interests="${request.interests || "none"}", timing="${request.timing || "soon"}", storePreference="${request.storePreference || "any"}". searchQuery should be short and useful for an online search. store must be one of Etsy, Amazon, Target. cardMessage should be a warm second-person note (avoid formal words like "check-in"). theme should be a short visual vibe phrase for a greeting card.`;
	try {
		const content = await requestChatCompletion(prompt);
		const parsed = content ? safeJsonParse<GiftIdea>(content) : null;
		if (!parsed?.title || !parsed?.searchQuery) {
			return fallbackGiftIdea(request);
		}
		return {
			...parsed,
			cardMessage: ensureSecondPerson(parsed.cardMessage || ""),
			store: parsed.store || "Etsy",
		};
	} catch (error) {
		console.error("AI gift idea error", error);
		return fallbackGiftIdea(request);
	}
};

/* ---------------------------------------------------------------------------
 * Dynamic card prompt builder
 * --------------------------------------------------------------------------- */

const detectTone = (
	theme: string,
	styleNotes: string
): string => {
	const combined = `${theme} ${styleNotes}`.toLowerCase();
	if (/romantic|love|flirtat/.test(combined)) return "romantic";
	if (/silly|funny|playful/.test(combined)) return "silly";
	if (/deep|meaningful|soulful/.test(combined)) return "deep";
	if (/comfort|support|empathy/.test(combined)) return "comfort";
	if (/professional|elegant/.test(combined)) return "professional";
	if (/cute|adorable|sweet/.test(combined)) return "cute";
	return "default";
};

const paletteForTone = (tone: string): string => {
	switch (tone) {
		case "romantic":
			return `- backgroundColor: warm pinks (#ff9ab5), blush (#fff0f5), or soft rose.
- overlayColor: deep rose (#c9184a) or deep navy (#181445).
- backgroundSvg palette: warm pinks (#ff9ab5), deep roses (#c9184a), blush (#fff0f5), gold accents (#c9a227). Use flowing curves, hearts, and soft gradients.
- mascotSvg accents: pink and gold highlights.`;
		case "silly":
			return `- backgroundColor: bright yellow (#ffd60a), light teal (#e0fcf5), or warm orange tint.
- overlayColor: deep teal (#0a4f4f) or charcoal (#2d3436).
- backgroundSvg palette: bright yellows (#ffd60a), teals (#2ec4b6), orange (#ff6b35). Pop art energy — bold shapes, confetti, zigzags.
- mascotSvg accents: teal and orange highlights.`;
		case "deep":
			return `- backgroundColor: deep navy (#181445), muted purple (#6b4f9c), or dark indigo.
- overlayColor: warm amber (#d4a373) or cream (#faf3e0) for contrast.
- backgroundSvg palette: deep navy (#181445), muted purples (#6b4f9c), warm amber (#d4a373). Use subtle gradients, layered circles, contemplative compositions.
- mascotSvg accents: amber and muted purple highlights.`;
		case "comfort":
			return `- backgroundColor: sage green (#b7e4c7), soft cream (#fefae0), or gentle lavender (#e8dff5).
- overlayColor: deep green (#1b4332) or deep navy (#181445).
- backgroundSvg palette: sage greens (#b7e4c7), soft cream (#fefae0), gentle lavender. Use soft, rounded organic shapes, warm gradients.
- mascotSvg accents: sage green and lavender highlights.`;
		case "professional":
			return `- backgroundColor: cream (#faf3e0), light charcoal (#f5f5f5), or off-white.
- overlayColor: charcoal (#2d3436) or deep navy (#181445).
- backgroundSvg palette: charcoal (#2d3436), cream (#faf3e0), gold (#c9a227). Minimal palette, clean geometric shapes, subtle gradients.
- mascotSvg accents: gold and charcoal highlights.`;
		case "cute":
			return `- backgroundColor: pastel pink (#ffc8dd), baby blue (#a2d2ff), or mint (#caffbf).
- overlayColor: deep plum (#4a154b) or deep navy (#181445).
- backgroundSvg palette: pastel pinks (#ffc8dd), baby blue (#a2d2ff), mint (#caffbf). Soft rounded shapes, stars, bubbles.
- mascotSvg accents: pastel pink and mint highlights.`;
		default:
			return `- backgroundColor: soft, muted tones — lavender (#f6f2ff), cream (#fcf8ff), blush (#fff0f5), sage (#f0fff4). Avoid bright saturated backgrounds.
- overlayColor: deep navy (#181445) or deep purple (#2c0051).
- backgroundSvg palette: purples (#9333ea, #ddb8ff, #f0dbff), mints (#6cf8bb, #007a58), warm neutrals. Gradients, layered circles, flowing curves.
- mascotSvg accents: purple and mint highlights.`;
	}
};

const mascotForTone = (tone: string): string => {
	const base = "warm peach/cream character with pink blush cheeks";
	switch (tone) {
		case "romantic":
			return `${base} — expressive, blushing, heart-themed`;
		case "silly":
			return `${base} — goofy, wide-eyed, playful pose`;
		case "deep":
			return `${base} — calm, contemplative, soft expression`;
		case "comfort":
			return `${base} — warm, hugging, gentle and reassuring`;
		case "professional":
			return `${base} — poised, confident, clean lines`;
		case "cute":
			return `${base} — round, sparkly-eyed, cheerful pose`;
		default:
			return `${base} — friendly, warm, whimsical`;
	}
};

const typographyForTone = (tone: string): string => {
	switch (tone) {
		case "romantic":
			return `Strongly prefer "Playfair Display" or "Cormorant Garamond" (elegant serifs).`;
		case "silly":
			return `Strongly prefer "Fredoka" or "Baloo 2" (rounded, fun fonts).`;
		case "deep":
			return `Strongly prefer "DM Serif Display" or "Source Serif Pro" (classic, grounded serifs).`;
		case "professional":
			return `Strongly prefer "Plus Jakarta Sans" or "Inter" (clean sans-serif).`;
		default:
			return `Strongly prefer "Plus Jakarta Sans" or "DM Serif Display".`;
	}
};

const occasionCopyGuidance = (occasion: string): string => {
	const lower = occasion.toLowerCase();
	if (/birthday/.test(lower))
		return "For birthdays, lead with celebration energy. Make the reader feel the spotlight is on them.";
	if (/anniversary/.test(lower))
		return "For anniversaries, honor the journey together. Reflect shared growth and warmth.";
	if (/wedding/.test(lower))
		return "For weddings, radiate joy and new beginnings. Keep the tone uplifting and forward-looking.";
	if (/thank|gratitude/.test(lower))
		return "For thank-you cards, be specific about what you are grateful for. Warmth over formality.";
	if (/sorry|apolog/.test(lower))
		return "For apologies, lead with sincerity and accountability. Keep it honest, not overwrought.";
	if (/congrat/.test(lower))
		return "For congratulations, amplify their achievement. Make it feel well-deserved.";
	if (/get well|recover/.test(lower))
		return "For get-well cards, be encouraging without minimizing. Warmth and gentle optimism.";
	if (/miss|thinking of/.test(lower))
		return "For missing-you cards, be tender and present. Let them feel how much they matter.";
	return "";
};

const extractStyleInstructions = (styleNotes: string): string => {
	if (!styleNotes) return "";
	const lower = styleNotes.toLowerCase();
	const instructions: string[] = [];

	if (/neon/.test(lower))
		instructions.push(
			"Use neon glow effects — bright stroke colors with subtle drop-shadow filters to simulate neon lighting."
		);
	if (/watercolor/.test(lower))
		instructions.push(
			"Use soft watercolor-style fills — semi-transparent overlapping shapes with feathered edges."
		);
	if (/geometric/.test(lower))
		instructions.push(
			"Use geometric patterns — triangles, hexagons, and clean angular compositions."
		);
	if (/hand[- ]?drawn|sketch/.test(lower))
		instructions.push(
			"Use a hand-drawn aesthetic — slightly uneven strokes, organic wobble, pencil-sketch feel."
		);
	if (/retro|vintage/.test(lower))
		instructions.push(
			"Use a retro/vintage aesthetic — muted tones, halftone dots, aged paper textures."
		);
	if (/minimalist|minimal/.test(lower))
		instructions.push(
			"Keep the design minimalist — lots of whitespace, few elements, maximum restraint."
		);

	// Check for explicit color mentions (hex codes or named colors)
	const hexMatches = styleNotes.match(/#[0-9a-fA-F]{3,8}/g);
	if (hexMatches) {
		instructions.push(
			`Incorporate these specific colors into the palette: ${hexMatches.join(", ")}.`
		);
	}

	return instructions.length > 0
		? "\nAdditional SVG style instructions:\n- " + instructions.join("\n- ")
		: "";
};

const buildCardPrompt = (request: CardRequest): string => {
	const theme = request.theme || "gentle";
	const tone = detectTone(theme, request.styleNotes || "");
	const isShort =
		/\bshort\b|\bsweet\b/i.test(theme) ||
		/\bshort\b|\bsweet\b/i.test(request.styleNotes || "");
	const wordLimit = isShort ? 30 : 55;

	const customMessageRule = request.customMessage
		? `- Weave the user's own words into the message naturally — do not discard them, but refine and integrate them.`
		: `- Generate the message from scratch based on the occasion and tone.`;

	const occasionGuidance = occasionCopyGuidance(request.occasion);
	const palette = paletteForTone(tone);
	const mascot = mascotForTone(tone);
	const typography = typographyForTone(tone);
	const styleInstructions = extractStyleInstructions(request.styleNotes || "");

	const isRemix = request.isRemixJourney;
	const isStreak = request.isStreakBadge;
	const isForward = request.isPayForward;

	let specialRules = "";
	let specialDesign = "";
	if (isRemix) {
		specialRules = `
MEMORY REMIXER MODE — CELEBRATION OF JOURNEY:
- This card celebrates the full history between sender and ${request.recipient}.
- Start the message with something like "Based on the cards and moments we've shared before..." or "Here's a celebration of our journey...".
- Weave in a warm, specific AI-crafted summary of the relationship arc from past moments (use provided journeySummary if present).
- Make it deeply emotional, nostalgic yet forward-looking, the kind people rave about and forward to the recipient or friends.
- Title ideas: "Our Journey", "Celebrating Us", "All the Little Moments", "You & Me, So Far".
- subtitle can be "A love letter to our shared path" or similar.
`;
		specialDesign = `
- For backgroundSvg: create an especially rich, layered "memory quilt" or "journey map" composition — subtle connected paths, clusters of small symbolic elements (tiny hearts, stars, envelopes, coffee cups, hands), accumulating warmth from bottom-left (past) to top-right (present/future). More intricate than usual, still clean vector.
- mascotSvg: two gentle figures or intertwined symbols + one uplifting element (lantern, growing plant, constellation).
`;
	} else if (isStreak) {
		specialRules = `
STREAK BADGE / CIRCLE SHARING MODE:
- Celebrate a ${request.streakDays || 7}-day streak of showing up for each other with great deals and savings.
- Proud, joyful, habit-affirming tone. "Our ${request.streakDays || 7}-day streak", "We keep choosing each other".
- Make it proudly social within real relationships — badge-like but still a full warm card.
- Title: "${request.streakDays || 7}-Day Streak" or "Our Streak" or "7 Days of Us".
`;
		specialDesign = `
- backgroundSvg: celebratory badge aesthetic — ribbons, subtle confetti dots or starbursts, a central glowing emblem (flame + heart, or interlocked rings with count), warm gradient celebrating consistency. Still soft and intimate, not loud corporate.
- mascotSvg: happy determined character holding a small banner or growing flame/plant.
`;
	} else if (isForward) {
		specialRules = `
PAY IT FORWARD / ANONYMOUS ENCOURAGEMENT MODE:
- No named recipient — the card is "to someone having a similar day" or "for you, exactly as you are today".
- Anonymous, generous spirit. Message should feel like a gentle hand on the shoulder from a stranger who cares.
- Include a soft invitation to pass it on. "If this found you on a hard day, pass a little light forward."
- Keep recipient field generic like "you" or a soft placeholder.
`;
		specialDesign = `
- Use comforting, spa-like or soft encouragement palette.
- backgroundSvg: soft enveloping shapes, a single small light source or open window or two hands cupping light — quiet hope.
`;
	}

	return `Return strict JSON with keys:
- title
- subtitle
- message
- signoff
- backgroundSvg
- mascotSvg
- typography
- fontCssUrl
- backgroundColor
- overlayColor

Inputs:
recipient="${request.recipient}"
occasion="${request.occasion}"
theme="${theme}"
customMessage="${request.customMessage || "none"}"
designNotes="${request.styleNotes || "none"}"
${isRemix && request.journeySummary ? `journeySummary="${request.journeySummary}"` : ""}
${isRemix && request.pastMomentsCount ? `pastMomentsCount=${request.pastMomentsCount}` : ""}

Copy rules:
- Address the recipient directly. Do NOT say "my wife/husband/partner" in the message.
- Do NOT echo relationship labels that appear in the recipient field; treat recipient as a name.
- Keep message under ${wordLimit} words, warm and specific, not cringe, no generic filler.
- If occasion is "love", NEVER write "Happy love". Use language like "I feel so much love for you."
- title: 2–6 words. subtitle: short (<= 7 words), ideally "For <recipient>" or similar.
${customMessageRule}
${occasionGuidance ? `- ${occasionGuidance}` : ""}
${specialRules}

Design rules:
- backgroundSvg must be a complete illustrated SVG with viewBox="0 0 1200 800". Use vector shapes (path/rect/circle/ellipse). No external images. Create rich layered compositions with organic shapes, gradients, and subtle patterns.
- mascotSvg must be a complete illustrated SVG with viewBox="0 0 360 360". Make it expressive and characterful.
- Avoid huge strokes/filters that create overflow outside the viewBox.
- overlayColor must keep text readable over the art.
${specialDesign}

Palette guidance:
${palette}

Mascot guidance:
- mascotSvg should depict a ${mascot}. Think expressive, whimsical, editorial.${styleInstructions}

Typography rules:
- ${typography}
- If you choose a non-system font, provide a Google Fonts CSS URL as fontCssUrl.

Everything must be newly authored for this card and cohesive. The result should feel like a premium digital keepsake — editorial, intimate, and layered.`;
};

const buildCardSystemPrompt = (request: CardRequest): string => {
	const tone = detectTone(request.theme || "", request.styleNotes || "");
	switch (tone) {
		case "silly":
			return "You are a playful, witty greeting card designer who loves bold colors and fun illustrations. You create cards that make people smile and laugh. Reply in concise JSON only.";
		case "professional":
			return "You are a refined, sophisticated greeting card designer with an eye for clean typography and elegant restraint. You create polished, tasteful cards. Reply in concise JSON only.";
		case "romantic":
			return "You are a romantic editorial greeting card designer. You create intimate, heartfelt digital keepsakes with lush illustrations and warm palettes. Reply in concise JSON only.";
		case "deep":
			return "You are a thoughtful, introspective greeting card designer. You create meaningful cards with rich depth, contemplative compositions, and grounded aesthetics. Reply in concise JSON only.";
		case "comfort":
			return "You are a warm, empathetic greeting card designer. You create comforting, reassuring cards with gentle palettes and soft, inviting illustrations. Reply in concise JSON only.";
		default:
			return "You are a premium editorial greeting card designer. You create digital keepsakes with rich SVG illustrations, layered compositions, and sophisticated color palettes. Reply in concise JSON only.";
	}
};

export const generateGreetingCard = async (
	request: CardRequest
): Promise<CardResponse> => {
	if (!AI_AVAILABLE) {
		return fallbackCard(request);
	}
	try {
		const prompt = buildCardPrompt(request);
		const systemPrompt = buildCardSystemPrompt(request);
		const content = await requestChatCompletion(prompt, systemPrompt);
		const parsed = content
			? safeJsonParse<CardResponse>(content)
			: null;
		if (!parsed?.message || !parsed?.backgroundSvg || !parsed?.mascotSvg) {
			return fallbackCard(request);
		}
		return ensureIllustratedCard(parsed, request);
	} catch (error) {
		console.error("AI card generation error", error);
		return fallbackCard(request);
	}
};

// Generate a poetic journey summary from past moments for Memory Remixer
export const generateJourneySummary = async (
	recipient: string,
	pastMoments: Array<{ occasion?: string; title?: string; theme?: string }>
): Promise<string> => {
	if (!AI_AVAILABLE || pastMoments.length === 0) {
		const count = pastMoments.length;
		return count > 1
			? `We've marked ${count} little chapters together — from ${pastMoments[0]?.occasion || "quiet days"} to now. Every note built something lasting.`
			: "Every small moment we've shared has been a thread in something beautiful.";
	}
	const list = pastMoments
		.slice(0, 8)
		.map((m, i) => `${i + 1}. ${m.occasion || "moment"} — ${m.title || ""}`)
		.join("; ");
	const prompt = `Summarize the emotional journey of a relationship in 2-3 warm, specific sentences for use inside a celebration card. Recipient name is ${recipient || "them"}. Past moments: ${list}. Focus on growth, care, consistency and joy. Avoid cliche. Sound personal and true.`;
	try {
		const system = "You write brief, emotionally resonant relationship summaries for premium greeting cards. 2-3 sentences max. No moralizing.";
		const text = await requestChatCompletion(prompt, system);
		return (text || "").trim().slice(0, 280) || "We've built something quietly extraordinary, one thoughtful card at a time.";
	} catch {
		return "We've built something quietly extraordinary, one thoughtful card at a time.";
	}
};
