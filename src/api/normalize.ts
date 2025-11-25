import type {
	ApiFilm,
	ApiPerson,
	ApiStarship,
	Film,
	LinkRef,
	Person,
	Starship,
} from "./types";

/* ── helpers ─────────────────────────────────────────────── */

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

/** shallow+deep camelCase */
export function camelizeKeys<T = unknown>(input: unknown): T {
	if (Array.isArray(input)) {
		return input.map((v) => camelizeKeys(v)) as unknown as T;
	}
	if (input && typeof input === "object") {
		const out: Record<string, unknown> = {};
		for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
			const ck = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
			out[ck] = camelizeKeys(v);
		}
		return out as T;
	}
	return input as T;
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
	const b = (base ?? "").replace(/\/+$/, "");
	return (refs ?? []).map((r) => {
		const id = extractId(r);
		if (id) {
			return `${b}/${resource}/${id}/`;
		}
		const s = String(r);
		return s.startsWith("http")
			? s
			: `${b}/${resource}/${s.replace(/^\/+/, "")}`;
	});
}

/* ── API -> Domain (camelCase) ───────────────────────────── */

export function normalizePerson(raw: ApiPerson): Person {
	const id = extractId(raw.id ?? raw.url);
	const c = camelizeKeys<ApiPerson>(raw);
	return {
		id,
		url: raw.url ?? "",
		name: raw.name ?? "",
		eyeColor: (c as unknown as { eyeColor?: string | null }).eyeColor ?? null,
		birthYear:
			(c as unknown as { birthYear?: string | null }).birthYear ?? null,
		gender: (c as unknown as { gender?: string | null }).gender ?? null,
		films: Array.isArray(raw.films) ? (raw.films as LinkRef[]) : [],
		starships: Array.isArray(raw.starships) ? (raw.starships as LinkRef[]) : [],
		vehicles: Array.isArray(raw.vehicles) ? (raw.vehicles as LinkRef[]) : [],
	};
}

export function normalizeFilm(raw: ApiFilm): Film {
	const id = extractId(raw.id ?? raw.url);
	return {
		id,
		url: raw.url ?? "",
		title: raw.title ?? "",
		starships: Array.isArray(raw.starships) ? (raw.starships as LinkRef[]) : [],
		characters: Array.isArray(raw.characters)
			? (raw.characters as LinkRef[])
			: [],
	};
}

export function normalizeStarship(raw: ApiStarship): Starship {
	const id = extractId(raw.id ?? raw.url);
	return {
		id,
		url: raw.url ?? "",
		name: raw.name ?? "",
		films: Array.isArray(raw.films) ? (raw.films as LinkRef[]) : [],
		pilots: Array.isArray(raw.pilots) ? (raw.pilots as LinkRef[]) : [],
	};
}

export const toPerson = normalizePerson;
