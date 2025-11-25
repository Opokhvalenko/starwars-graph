export type HttpError = Error & { status?: number };

export const API_BASE = (() => {
	const raw =
		(import.meta.env.VITE_SW_API_BASE as string | undefined) ?? "/api";
	const val = String(raw).trim();
	if (/^https?:\/\//i.test(val)) {
		return val.replace(/\/+$/, "");
	}
	return "/api";
})();

export function apiUrl(pathOrUrl: string): string {
	if (/^https?:\/\//i.test(pathOrUrl)) {
		return pathOrUrl;
	}
	const base = API_BASE.replace(/\/+$/, "");
	const p = pathOrUrl.replace(/^\/+/, "");
	return `${base}/${p}`;
}

function toAbsoluteUrl(url: string): URL {
	if (/^https?:\/\//i.test(url)) {
		return new URL(url);
	}
	const origin =
		typeof window !== "undefined" && window.location?.origin
			? window.location.origin
			: "http://localhost";
	return new URL(url, origin);
}

export async function getJson<T>(
	pathOrUrl: string,
	init?: RequestInit,
): Promise<T> {
	const raw = apiUrl(pathOrUrl);
	const urlObj = toAbsoluteUrl(raw);

	const req = new Request(urlObj, {
		method: "GET",
		headers: { accept: "application/json", ...(init?.headers ?? {}) },
		...(init ?? {}),
	});

	const res = await fetch(req);
	if (!res.ok) {
		const err: HttpError = new Error(`HTTP ${res.status}`);
		err.status = res.status;
		throw err;
	}
	return (await res.json()) as T;
}

export async function getJsonRetry<T>(
	pathOrUrl: string,
	attempts = 4,
	baseDelay = 250,
	init?: RequestInit,
): Promise<T> {
	for (let i = 0; i < attempts; i++) {
		try {
			return await getJson<T>(pathOrUrl, init);
		} catch (e) {
			const status =
				(e as HttpError)?.status ??
				Number(String((e as Error)?.message ?? "").match(/\b(\d{3})\b/)?.[1]);
			const retryable =
				status === 429 || (typeof status === "number" && status >= 500);
			if (!retryable || i === attempts - 1) {
				const err: HttpError = new Error(
					status === 429
						? "Too Many Requests (429)"
						: ((e as Error)?.message ?? "Request failed"),
				);
				err.status = status;
				throw err;
			}
			const jitter = Math.floor(Math.random() * 120);
			await new Promise((r) => setTimeout(r, baseDelay * 2 ** i + jitter));
		}
	}
	throw new Error("Exhausted retries");
}
