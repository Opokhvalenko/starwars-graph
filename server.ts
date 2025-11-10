/**
 * Fastify reverse proxy
 * - /api/* → https://sw-api.starnavi.io  (with simple in-memory cache + ETag)
 * - /img/* → https://starwars-visualguide.com (+ UA/Referer) with weserv.nl fallback
 */

import { createHash } from "node:crypto";
import cors from "@fastify/cors";
import Fastify from "fastify";

const PORT: number = Number(process.env.PORT ?? 8787);

// SW API
const SW_API_BASE: string =
	process.env.SW_API_BASE ?? "https://sw-api.starnavi.io";

// VisualGuide (images)
const VG_HTTPS_BASE: string =
	process.env.VG_HTTPS_BASE ?? "https://starwars-visualguide.com/assets/img";
const VG_HTTP_BASE: string =
	process.env.VG_HTTP_BASE ?? "http://starwars-visualguide.com/assets/img";

// CDN fallback
function weserv(url: string): string {
	const clean = url.replace(/^https?:\/\//, "");
	return `https://images.weserv.nl/?url=${encodeURIComponent(clean)}`;
}

type CacheEntry = {
	status: number;
	headers: Record<string, string>;
	body: Buffer;
	etag: string;
	expiresAt: number;
};

const TTL_API_MS = 60_000; // 1 min
const TTL_IMG_MS = 6 * 60 * 60 * 1000; // 6h
const cache = new Map<string, CacheEntry>();

const app = Fastify({ logger: false });

await app.register(cors, {
	origin: true,
	methods: ["GET", "HEAD", "OPTIONS"],
});

const FALLBACK_SVG_BODY = `
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
  <rect width="100%" height="100%" fill="#e5e7eb"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
        fill="#64748b" font-family="sans-serif" font-size="14">no image</text>
</svg>`.trim();

function now() {
	return Date.now();
}
function sha1(buf: Buffer) {
	return createHash("sha1").update(buf).digest("hex");
}
function hashETag(buf: Buffer) {
	return `W/"${sha1(buf)}"`;
}

async function proxyCached(
	targetUrl: string,
	ttl: number,
	headersToSend?: HeadersInit,
	mustBeImage = false,
): Promise<CacheEntry> {
	const cached = cache.get(targetUrl);
	if (cached && cached.expiresAt > now()) {
		return cached;
	}

	const res = await fetch(targetUrl, { headers: headersToSend });
	const buf = Buffer.from(await res.arrayBuffer());
	const ct = res.headers.get("content-type") ?? "";
	const etag = res.headers.get("etag") ?? hashETag(buf);

	const ok = res.ok && (!mustBeImage || ct.toLowerCase().startsWith("image/"));

	const entry: CacheEntry = {
		status: ok ? 200 : res.status,
		headers: {
			"content-type": ok ? ct : "text/plain; charset=utf-8",
			"cache-control": ok ? "public, max-age=21600" : "no-store",
			etag,
		},
		body: buf,
		etag,
		expiresAt: now() + ttl,
	};

	cache.set(targetUrl, entry);
	return entry;
}

app.get("/health", async () => ({ ok: true }));

/* ─────────────── /api/* ─────────────── */
app.get("/api/*", async (req, reply) => {
	const rest = (req.params as Record<string, string>)["*"] ?? "";
	const targetUrl = `${SW_API_BASE}/${rest}`;

	const inm = (req.headers["if-none-match"] as string | undefined) ?? "";
	const cached = cache.get(targetUrl);
	if (cached && cached.expiresAt > now() && inm && inm === cached.etag) {
		return reply.code(304).send();
	}

	const entry = await proxyCached(targetUrl, TTL_API_MS, {
		Accept: "application/json",
	});

	if (inm && inm === entry.etag) {
		return reply.code(304).send();
	}

	for (const [k, v] of Object.entries(entry.headers)) {
		reply.header(k, v);
	}
	return reply.code(entry.status).send(entry.body);
});

/* ─────────────── /img/* ─────────────── */
app.get("/img/*", async (req, reply) => {
	const rest = (req.params as Record<string, string>)["*"] ?? "";

	const httpsUrl = `${VG_HTTPS_BASE}/${rest}`;
	const commonHeaders: HeadersInit = {
		"User-Agent":
			req.headers["user-agent"] ??
			"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
		Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
		Referer: "https://starwars-visualguide.com/",
		"Accept-Language": "en-US,en;q=0.9",
	};

	// 304 via ETag
	const inm = (req.headers["if-none-match"] as string | undefined) ?? "";
	const cached = cache.get(httpsUrl);
	if (cached && cached.expiresAt > now() && inm && inm === cached.etag) {
		return reply.code(304).send();
	}

	// 1) https
	let entry = await proxyCached(httpsUrl, TTL_IMG_MS, commonHeaders, true);

	// 2) http
	if (!(entry.headers["content-type"] ?? "").startsWith("image/")) {
		const httpUrl = `${VG_HTTP_BASE}/${rest}`;
		entry = await proxyCached(httpUrl, TTL_IMG_MS, commonHeaders, true);
	}

	// 3) weserv CDN
	if (!(entry.headers["content-type"] ?? "").startsWith("image/")) {
		const cdnUrl = weserv(`${VG_HTTPS_BASE}/${rest}`);
		entry = await proxyCached(cdnUrl, TTL_IMG_MS, commonHeaders, true);
	}

	// 4) fallback SVG
	if (!(entry.headers["content-type"] ?? "").startsWith("image/")) {
		const buf = Buffer.from(FALLBACK_SVG_BODY, "utf8");
		reply
			.header("content-type", "image/svg+xml")
			.header("cache-control", "public, max-age=86400");
		return reply.code(200).send(buf);
	}

	if (inm && inm === entry.etag) {
		return reply.code(304).send();
	}

	for (const [k, v] of Object.entries(entry.headers)) {
		reply.header(k, v);
	}
	return reply.code(200).send(entry.body);
});

app
	.listen({ port: PORT, host: "0.0.0.0" })
	.then(() =>
		console.log(
			`[proxy] http://localhost:${PORT} → SW:${SW_API_BASE} | VG:${VG_HTTPS_BASE} | ${VG_HTTP_BASE}`,
		),
	);
