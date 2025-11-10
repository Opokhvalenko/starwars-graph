export class HttpError extends Error {
	public readonly status: number;
	public readonly url: string;
	public readonly details?: unknown;
	constructor(message: string, status: number, url: string, details?: unknown) {
		super(message);
		this.name = "HttpError";
		this.status = status;
		this.url = url;
		this.details = details;
	}
}

// default to same-origin proxy (/api)
const API_BASE = (import.meta.env.VITE_SW_API_BASE as string) ?? "/api";

/** Normalize absolute/relative URL to our /api endpoint */
export function toApi(url: string): string {
	const base = API_BASE.replace(/\/+$/, "");
	// relative
	if (!/^https?:\/\//i.test(url)) {
		if (url.startsWith("/api/")) {
			return url; // do not double-prefix
		}
		return url.startsWith("/") ? `${base}${url}` : `${base}/${url}`;
	}
	// absolute -> rewrite to /api preserving path & search
	try {
		const b = new URL(base, location.origin);
		const u = new URL(url);
		const prefix = b.pathname.replace(/\/+$/, "");
		return `${b.origin}${prefix}${u.pathname}${u.search}`;
	} catch {
		return url;
	}
}

export async function getJson<T>(
	url: string,
	signal?: AbortSignal,
): Promise<T> {
	const finalUrl = toApi(url);
	const res = await fetch(finalUrl, {
		signal,
		headers: { Accept: "application/json" },
	});
	if (!res.ok) {
		const text = await res.text().catch(() => "");
		throw new HttpError(
			`Request failed with status ${res.status}`,
			res.status,
			finalUrl,
			text,
		);
	}
	try {
		return (await res.json()) as T;
	} catch (e) {
		throw new HttpError("Failed to parse JSON", res.status, finalUrl, e);
	}
}

/** Small sleep helper */
function sleep(ms: number): Promise<void> {
	return new Promise((r) => setTimeout(r, ms));
}

/** getJson with simple retry/backoff for flaky resources */
export async function getJsonRetry<T>(
	url: string,
	opts?: {
		retries?: number;
		backoff?: number[];
		signal?: AbortSignal;
	},
): Promise<T> {
	const retries = opts?.retries ?? 2;
	const backoff = opts?.backoff ?? [300, 700, 1200];
	const signal = opts?.signal;

	let attempt = 0;
	// eslint-disable-next-line no-constant-condition
	while (true) {
		try {
			return await getJson<T>(url, signal);
		} catch (e) {
			const status = e instanceof HttpError ? e.status : 0;
			const retryable = status === 429 || status === 503 || status === 0;
			if (!retryable || attempt >= retries) {
				throw e;
			}

			const delay = backoff[Math.min(attempt, backoff.length - 1)] ?? 500;
			await sleep(delay);
			attempt += 1;
		}
	}
}
