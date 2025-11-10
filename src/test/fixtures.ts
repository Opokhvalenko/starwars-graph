import type { Film, PaginatedResponse, Person, Starship } from "@api/types";

const BASE = "https://sw-api.starnavi.io";
const personUrl = (id: number) => `${BASE}/people/${id}/`;
const filmUrl = (id: number) => `${BASE}/films/${id}/`;
const shipUrl = (id: number) => `${BASE}/starships/${id}/`;

const idFrom = (u: string): number | null => {
	const m = u.match(/\/(\d+)\/?$/);
	return m ? Number(m[1]) : null;
};

/** Explicitly typed singletons for tests */
export const PERSON_1: Person = {
	id: idFrom(personUrl(1)),
	name: "Luke Skywalker",
	url: personUrl(1),
	films: [filmUrl(1)],
	starships: [shipUrl(12)],
	vehicles: [],
};

export const PERSON_5: Person = {
	id: idFrom(personUrl(5)),
	name: "Leia Organa",
	url: personUrl(5),
	films: [filmUrl(1)],
	starships: [],
	vehicles: [],
};

export const FILM_1: Film = {
	id: idFrom(filmUrl(1)),
	title: "A New Hope",
	url: filmUrl(1),
	starships: [shipUrl(12)],
	characters: [personUrl(1), personUrl(5)],
};

export const STARSHIP_12: Starship = {
	id: idFrom(shipUrl(12)),
	name: "X-wing",
	url: shipUrl(12),
	films: [filmUrl(1)],
	pilots: [personUrl(1)],
};

/** Mini-DB */
export const peopleDb: Person[] = [PERSON_1, PERSON_5];
export const filmsDb: Film[] = [FILM_1];
export const starshipsDb: Starship[] = [STARSHIP_12];

export function findFilmById(id: number): Film | undefined {
	return filmsDb.find((f) => f.url.endsWith(`/${id}/`));
}
export function findShipById(id: number): Starship | undefined {
	return starshipsDb.find((s) => s.url.endsWith(`/${id}/`));
}

/** Paginated list with simple "search" filter */
export function listPeoplePage(
	page: number,
	search?: string | null,
	pageSize = 10,
): PaginatedResponse<Person> {
	const q = (search ?? "").trim().toLowerCase();
	const filtered = q
		? peopleDb.filter((p) => p.name.toLowerCase().includes(q))
		: peopleDb;

	const start = (page - 1) * pageSize;
	const slice = filtered.slice(start, start + pageSize);

	const addQ = (u: string) => (q ? `${u}&search=${encodeURIComponent(q)}` : u);

	const next =
		start + pageSize < filtered.length
			? addQ(`${BASE}/people/?page=${page + 1}`)
			: null;
	const previous = page > 1 ? addQ(`${BASE}/people/?page=${page - 1}`) : null;

	return {
		count: filtered.length,
		next,
		previous,
		results: slice,
	};
}

/** Handy builder for graph tests */
export function makeGraphFixtures() {
	return { person: PERSON_1, films: [FILM_1], starships: [STARSHIP_12] };
}
