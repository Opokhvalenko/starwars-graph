import { getJsonRetry } from "@api/http";
import type { Person } from "@api/types";

export type PeopleApiResponse = {
	count: number;
	next: string | null;
	previous: string | null;
	results: Person[];
};

function cloneParams(src: URLSearchParams): URLSearchParams {
	const out = new URLSearchParams();
	src.forEach((v, k) => {
		out.set(k, String(v).trim());
	});
	return out;
}

function buildPeopleUrl(sp: URLSearchParams): string {
	const origin =
		typeof window !== "undefined" && window.location?.origin
			? window.location.origin
			: "http://localhost";

	const base = (
		(import.meta.env.VITE_SW_API_BASE as string | undefined) ?? "/api"
	).replace(/\/+$/, "");

	// works for both absolute and relative base values
	const url = new URL(`${base}/people/`, origin);

	for (const [k, v] of sp.entries()) {
		url.searchParams.set(k, v);
	}

	return url.toString();
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
	return getJsonRetry<PeopleApiResponse>(url);
}
