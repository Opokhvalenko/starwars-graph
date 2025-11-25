import { getJson } from "@api/http";
import { normalizePerson } from "@api/normalize";
import type { ApiPerson, PaginatedResponse, Person } from "@api/types";

export type PeopleApiResponse = {
	count: number;
	next: string | null;
	previous: string | null;
	results: Person[];
};

export const searches: string[] = [];

function cloneParams(src: URLSearchParams): URLSearchParams {
	const out = new URLSearchParams();
	for (const [k, v] of src.entries()) {
		out.set(k, String(v).trim());
	}
	return out;
}

function buildPeoplePath(sp: URLSearchParams): string {
	const u = new URL("/people/", "http://local.placeholder");
	sp.forEach((v, k) => {
		u.searchParams.set(k, v);
	});
	return `${u.pathname}${u.search}`;
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

	//  filters.test.tsx
	searches.push(sp.toString());

	const path = buildPeoplePath(sp); // "/people/?page=1&…"
	const data = await getJson<PaginatedResponse<ApiPerson>>(path);

	const results = (data.results ?? []).map(normalizePerson);
	return {
		count: data.count ?? 0,
		next: data.next ?? null,
		previous: data.previous ?? null,
		results,
	};
}
