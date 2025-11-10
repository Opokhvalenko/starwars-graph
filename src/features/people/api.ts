import type { Person } from "@api/types";

export type PeopleApiResponse = {
	count: number;
	next: string | null;
	previous: string | null;
	results: Person[];
};

function cloneParams(src: URLSearchParams): URLSearchParams {
	const out = new URLSearchParams();
	for (const [k, v] of src.entries()) {
		out.set(k, String(v).trim());
	}
	return out;
}

function resolveApiBase(): string {
	const raw =
		(import.meta.env.VITE_SW_API_BASE as string | undefined) ?? "/api";
	const val = raw.trim();

	if (/^https?:\/\//i.test(val)) {
		return val.replace(/\/+$/, "");
	}

	if (/^\/?api(\/api)*\/?$/i.test(val)) {
		return "/api";
	}

	return "/api";
}

function buildPeopleUrl(sp: URLSearchParams): string {
	const base = resolveApiBase();

	if (/^https?:\/\//i.test(base)) {
		const u = new URL("/people/", base);
		for (const [k, v] of sp.entries()) {
			u.searchParams.set(k, v);
		}
		return u.toString();
	}

	const origin =
		typeof window !== "undefined" && window.location?.origin
			? window.location.origin
			: "http://localhost";

	const u = new URL(`${base}/people/`, origin);
	for (const [k, v] of sp.entries()) {
		u.searchParams.set(k, v);
	}
	return u.toString();
}

export async function fetchPeople(
	params: URLSearchParams,
): Promise<PeopleApiResponse> {
	const sp = cloneParams(params);

	if (!sp.get("page")) {
		sp.set("page", "1");
	}

	const q = sp.get("q");
	if (q && !sp.get("search")) {
		sp.set("search", q);
	}

	const url = buildPeopleUrl(sp);
	const res = await fetch(url, { method: "GET" });

	if (!res.ok) {
		throw new Error(`Failed to load people: ${res.status}`);
	}

	const data = (await res.json()) as PeopleApiResponse;
	return data;
}
