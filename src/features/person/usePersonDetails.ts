import { getJsonRetry } from "@api/http";
import { extractId } from "@api/normalize";
import type { Film, LinkRef, Person, Starship } from "@api/types";
import { useEffect, useMemo, useState } from "react";

export async function throttleAll<T>(
	urls: string[],
	worker: (u: string) => Promise<T>,
	limit = 2,
	gapMs = 120,
): Promise<T[]> {
	if (!urls.length) {
		return [];
	}
	const results: T[] = [];
	let idx = 0;

	async function runner(): Promise<void> {
		// eslint-disable-next-line no-constant-condition
		while (true) {
			const i = idx++;
			if (i >= urls.length) {
				break;
			}
			const u = urls[i] as string;
			try {
				const v = await worker(u);
				results.push(v);
			} catch {}
			if (gapMs > 0) {
				await new Promise((r) => setTimeout(r, gapMs));
			}
		}
	}

	const workers = Array.from({ length: Math.min(limit, urls.length) }, () =>
		runner(),
	);
	await Promise.all(workers);
	return results;
}

function toRelative(
	resource: "films" | "starships",
	refs: LinkRef[] | null | undefined,
): string[] {
	const arr = Array.isArray(refs) ? refs : [];
	return arr.map((r) => {
		const id = extractId(r);
		if (id != null) {
			return `/${resource}/${id}/`;
		}
		const s = String(r);
		const m = s.match(/\/(films|starships)\/\d+\/$/);
		return m ? m[0] : `/${resource}/${s.replace(/^\/+/, "")}`;
	});
}

export function usePersonDetails(id?: string) {
	const [person, setPerson] = useState<Person | null>(null);
	const [films, setFilms] = useState<Film[]>([]);
	const [starships, setStarships] = useState<Starship[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		if (!id) {
			setPerson(null);
			setFilms([]);
			setStarships([]);
			setError("Missing id");
			setLoading(false);
			return;
		}

		(async () => {
			try {
				setLoading(true);
				setError(null);

				const personPath = `/people/${id}/`;
				const p = await getJsonRetry<Person>(personPath);
				if (cancelled) {
					return;
				}

				setPerson(p);

				const filmPaths = toRelative("films", p.films);
				const shipPaths = toRelative("starships", p.starships);

				const [filmsData, starshipsData] = await Promise.all([
					throttleAll(filmPaths, (u) => getJsonRetry<Film>(u), 2, 120),
					throttleAll(shipPaths, (u) => getJsonRetry<Starship>(u), 2, 120),
				]);
				if (cancelled) {
					return;
				}

				setFilms(filmsData);
				setStarships(starshipsData);
			} catch (e) {
				if (!cancelled) {
					setError((e as Error)?.message ?? "Unknown error");
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [id]);

	const title = useMemo(() => (person ? person.name : "Person"), [person]);

	return { person, films, starships, loading, error, title };
}
