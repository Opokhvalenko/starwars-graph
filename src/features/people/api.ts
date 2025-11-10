import { normalizeList, normalizePerson } from "../../api/normalize";
import type { Person, PersonRaw } from "../../api/types";

const BASE = (import.meta.env.VITE_SW_API_BASE as string) ?? "/api";

export type PeopleResp = { results: Person[] };

type PeopleApiResponse = {
	results: PersonRaw[];
	count?: number;
	next?: string | null;
	previous?: string | null;
};

export async function fetchPeople(
	page: number,
	q: string | null,
): Promise<PeopleResp> {
	const params = new URLSearchParams();
	if (page && page > 0) {
		params.set("page", String(page));
	}
	if (q?.trim()) {
		params.set("search", q.trim());
	}

	const res = await fetch(`${BASE}/people/?${params.toString()}`);
	if (!res.ok) {
		throw new Error(`People fetch failed: ${res.status}`);
	}

	const data = (await res.json()) as PeopleApiResponse;

	const all = normalizeList<Person, PersonRaw>(data.results, normalizePerson);

	const filtered = q?.trim()
		? all.filter((p) =>
				p.name.toLowerCase().includes(q.trim()?.toLowerCase() ?? ""),
			)
		: all;

	return { results: filtered };
}
