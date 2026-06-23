import { staticPages, knowledgeGuides, knowledgeIndexCopy, siteConfig, sitemapEntries } from "../../content/content.js";

type SeoMeta = {
	title: string;
	description: string;
	canonicalPath: string;
};

const escapeHtml = (value: string) =>
	value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");

const formatDate = (isoDate: string) =>
	new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});

const inlineMarkdown = (text: string) => {
	let result = escapeHtml(text);
	result = result.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
	result = result.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
	return result;
};

const markdownToHtml = (markdown: string) => {
	const lines = markdown.replace(/\r\n/g, "\n").split("\n");
	let html = "";
	let inUl = false;
	let inOl = false;
	let inBlockquote = false;

	const closeLists = () => {
		if (inUl) {
			html += "</ul>";
			inUl = false;
		}
		if (inOl) {
			html += "</ol>";
			inOl = false;
		}
		if (inBlockquote) {
			html += "</blockquote>";
			inBlockquote = false;
		}
	};

	for (const rawLine of lines) {
		const line = rawLine.trimEnd();
		if (!line.trim()) {
			closeLists();
			continue;
		}
		if (line.startsWith("### ")) {
			closeLists();
			html += `<h3>${inlineMarkdown(line.slice(4))}</h3>`;
			continue;
		}
		if (line.startsWith("## ")) {
			closeLists();
			html += `<h2>${inlineMarkdown(line.slice(3))}</h2>`;
			continue;
		}
		if (line.startsWith("# ")) {
			closeLists();
			html += `<h1>${inlineMarkdown(line.slice(2))}</h1>`;
			continue;
		}
		if (line.startsWith("> ")) {
			closeLists();
			if (!inBlockquote) {
				html += "<blockquote>";
				inBlockquote = true;
			}
			html += `<p>${inlineMarkdown(line.slice(2))}</p>`;
			continue;
		}
		if (line.match(/^\d+\.\s/)) {
			if (!inOl) {
				closeLists();
				html += "<ol>";
				inOl = true;
			}
			html += `<li>${inlineMarkdown(line.replace(/^\d+\.\s/, ""))}</li>`;
			continue;
		}
		if (line.startsWith("- ")) {
			if (!inUl) {
				closeLists();
				html += "<ul>";
				inUl = true;
			}
			html += `<li>${inlineMarkdown(line.slice(2))}</li>`;
			continue;
		}
		closeLists();
		html += `<p>${inlineMarkdown(line)}</p>`;
	}

	closeLists();
	return html;
};

const fullUrl = (path: string) => `${siteConfig.baseUrl}${path}`;

const tags = Array.from(new Set(knowledgeGuides.flatMap((guide) => guide.tags))).sort();

const pageTemplate = (meta: SeoMeta, body: string) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(meta.title)} | ${escapeHtml(siteConfig.siteName)}</title>
<meta name="description" content="${escapeHtml(meta.description)}" />
<link rel="canonical" href="${escapeHtml(fullUrl(meta.canonicalPath))}" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="${escapeHtml(siteConfig.siteName)}" />
<meta property="og:title" content="${escapeHtml(meta.title)}" />
<meta property="og:description" content="${escapeHtml(meta.description)}" />
<meta property="og:url" content="${escapeHtml(fullUrl(meta.canonicalPath))}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(meta.title)}" />
<meta name="twitter:description" content="${escapeHtml(meta.description)}" />
<style>
body{margin:0;background:#fcf8ff;color:#181445;font-family:"Be Vietnam Pro","Plus Jakarta Sans",system-ui,-apple-system,sans-serif;line-height:1.65}
main{max-width:860px;margin:0 auto;padding:28px 20px 64px;background:#fff;min-height:100vh}
a{color:#7800ce;text-decoration:none} a:hover{text-decoration:underline;opacity:0.8}
h1,h2,h3{line-height:1.15;color:#181445;font-family:"Plus Jakarta Sans",system-ui,sans-serif;letter-spacing:-0.02em} h1{font-size:2rem}
.article-meta{display:flex;gap:16px;color:#4d4354;font-size:.95rem;margin:.5rem 0 1.2rem}
.chip{display:inline-block;background:#f0dbff;color:#7800ce;padding:4px 10px;border-radius:999px;margin:0 8px 8px 0;font-size:.9rem;font-weight:600}
footer{border-top:none;background:#f6f2ff;margin-top:3rem;padding:1rem;border-radius:1rem;font-size:.95rem;display:flex;gap:12px;flex-wrap:wrap}
</style>
</head>
<body>
<main>
${body}
<footer>
<a href="/about">About</a>
<a href="/editorial-standards">Editorial Standards</a>
<a href="/ai-transparency">AI Transparency</a>
<a href="/support-resources">Support Resources</a>
<a href="/privacy">Privacy</a>
<a href="/terms">Terms</a>
<a href="https://growth.business" target="_blank" rel="noopener">growth.business hub</a>
</footer>
</main>
</body>
</html>`;

const staticPagesBySlug = new Map(staticPages.map((page) => [page.slug, page]));
const guidesBySlug = new Map(knowledgeGuides.map((guide) => [guide.slug, guide]));

export const renderStaticContentPage = (slug: string) => {
	const page = staticPagesBySlug.get(slug);
	if (!page) return null;
	const body = `${markdownToHtml(page.bodyMarkdown)}<p><strong>Last updated:</strong> ${formatDate(page.lastUpdatedISO)}</p>`;
	return pageTemplate(
		{ title: page.title, description: page.metaDescription, canonicalPath: page.slug },
		body,
	);
};

export const renderKnowledgeIndexPage = () => {
	const cards = knowledgeGuides
		.map(
			(guide) => `<article><h2><a href="${guide.url}">${escapeHtml(guide.title)}</a></h2><p>${escapeHtml(guide.metaDescription)}</p>
	<div>${guide.tags.map((tag) => `<a class="chip" href="/knowledge-base/tag/${encodeURIComponent(tag)}">#${escapeHtml(tag)}</a>`).join("")}</div></article>`,
		)
		.join("<hr/>");
	const body = `${markdownToHtml(knowledgeIndexCopy.heroMarkdown)}<p><a href="/">Visit app home</a></p>${cards}`;
	return pageTemplate(
		{ title: knowledgeIndexCopy.title, description: knowledgeIndexCopy.metaDescription, canonicalPath: "/knowledge-base" },
		body,
	);
};

export const renderKnowledgeArticlePage = (slug: string) => {
	const guide = guidesBySlug.get(slug);
	if (!guide) return null;
	const body = `<header><h1>${escapeHtml(guide.title)}</h1><div class="article-meta"><span>Author: ${escapeHtml(guide.author)}</span><span>Last updated: ${formatDate(guide.lastUpdatedISO)}</span></div></header>${markdownToHtml(guide.bodyMarkdown)}<p>${guide.tags.map((tag) => `<a class="chip" href="/knowledge-base/tag/${encodeURIComponent(tag)}">#${escapeHtml(tag)}</a>`).join("")}</p>`;
	return pageTemplate(
		{ title: guide.title, description: guide.metaDescription, canonicalPath: guide.url },
		body,
	);
};

export const renderKnowledgeTagPage = (tag: string) => {
	const matching = knowledgeGuides.filter((guide) => guide.tags.includes(tag));
	if (!matching.length) return null;
	const body = `<h1>Tag: #${escapeHtml(tag)}</h1><p>Browse relationship guides tagged with ${escapeHtml(tag)}.</p>${matching
		.map((guide) => `<article><h2><a href="${guide.url}">${escapeHtml(guide.title)}</a></h2><p>${escapeHtml(guide.metaDescription)}</p></article>`)
		.join("<hr/>")}<p>All tags: ${tags
		.map((item) => `<a class="chip" href="/knowledge-base/tag/${encodeURIComponent(item)}">#${escapeHtml(item)}</a>`)
		.join("")}</p>`;
	return pageTemplate(
		{ title: `Tag: ${tag}`, description: `Relationship guidance tagged ${tag}.`, canonicalPath: `/knowledge-base/tag/${encodeURIComponent(tag)}` },
		body,
	);
};

export const renderRobotsTxt = () => `User-agent: *
Allow: /

Sitemap: https://doting.co/sitemap.xml
`;

export const renderSitemapXml = () => {
	const lines = sitemapEntries
		.map(
			([loc, changefreq, priority]) =>
				`<url><loc>${escapeHtml(loc)}</loc><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`,
		)
		.join("");
	return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${lines}</urlset>`;
};
