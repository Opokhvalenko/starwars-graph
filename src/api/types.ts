/** API might return either URLs or numeric IDs (e.g. films: [2, 6]). */
export type LinkRef = string | number;
export type ResourceURL = string;

/** Generic paginated response shape from sw-api */
export interface PaginatedResponse<T> {
	count: number;
	next: string | null;
	previous: string | null;
	results: T[];
}

/* ── RAW (from API) ───────────────────────────────────────────── */

export interface PersonRaw {
	id?: number | string;
	url?: string;
	name?: string;
	films?: LinkRef[] | null;
	starships?: LinkRef[] | null;
	vehicles?: LinkRef[] | null;
	[k: string]: unknown;
}

export interface FilmRaw {
	id?: number | string;
	url?: string;
	title?: string;
	starships?: LinkRef[] | null;
	characters?: LinkRef[] | null;
	[k: string]: unknown;
}

export interface StarshipRaw {
	id?: number | string;
	url?: string;
	name?: string;
	films?: LinkRef[] | null;
	pilots?: LinkRef[] | null;
	[k: string]: unknown;
}

export interface Person {
	/** always present after normalize: number or null if cannot be parsed */
	id: number | null;
	url: ResourceURL;
	name: string;
	films: LinkRef[];
	starships: LinkRef[];
	vehicles: LinkRef[];
}

export interface Film {
	id: number | null;
	url: ResourceURL;
	title: string;
	starships: LinkRef[];
	characters: LinkRef[];
}

export interface Starship {
	id: number | null;
	url: ResourceURL;
	name: string;
	films: LinkRef[];
	pilots: LinkRef[];
}
