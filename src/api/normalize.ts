import type { LinkRef, Person, PersonRaw } from "./types";

export function extractId(
	input: number | string | null | undefined,
): number | null {
	if (typeof input === "number" && Number.isFinite(input)) {
		return input;
	}
	if (typeof input === "string") {
		const m = input.match(/(\d+)(?:\/)?$/);
		return m ? Number(m[1]) : null;
	}
	return null;
}

export function normalizePerson(raw: PersonRaw): Person {
	const id = extractId(raw.id ?? raw.url);
	return {
		id,
		url: raw.url ?? "",
		name: raw.name ?? "",
		films: Array.isArray(raw.films) ? (raw.films as LinkRef[]) : [],
		starships: Array.isArray(raw.starships) ? (raw.starships as LinkRef[]) : [],
		vehicles: Array.isArray(raw.vehicles) ? (raw.vehicles as LinkRef[]) : [],
	};
}

export function normalizeList<T, I = unknown>(
	items: I[] | null | undefined,
	map: (x: I) => T,
): T[] {
	return Array.isArray(items) ? items.map(map) : [];
}

export function mapRefs(
	base: string,
	resource:
		| "films"
		| "starships"
		| "vehicles"
		| "people"
		| "planets"
		| "species",
	refs: Array<number | string>,
): string[] {
	return (refs ?? []).map((r) => {
		const id = extractId(r);
		if (id) {
			return `${base}/${resource}/${id}/`;
		}
		return String(r);
	});
}
