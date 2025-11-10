import { getJson } from "@api/http";
import { mapRefs } from "@api/normalize";
import type { Film, Person, Starship } from "@api/types";
import ErrorMessage from "@components/ErrorMessage";
import Loader from "@components/Loader";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

const GraphView = lazy(() => import("./GraphView.lazy"));

type StatusError = Error & { status?: number };

function sleep(ms: number) {
	return new Promise((r) => setTimeout(r, ms));
}

function parseStatus(e: unknown): number | undefined {
	const err = e as Partial<StatusError>;
	if (typeof err?.status === "number") {
		return err.status;
	}
	const msg = String((e as Error)?.message ?? "");
	const m = msg.match(/\b(\d{3})\b/);
	return m ? Number(m[1]) : undefined;
}

function isRetryable(e: unknown): boolean {
	const s = parseStatus(e);
	return s === 429 || (typeof s === "number" && s >= 500);
}

/** getJson + retry/backoff  429/5xx */
async function loadWithRetry<T>(
	url: string,
	attempts = 4,
	baseDelay = 250,
): Promise<T> {
	for (let i = 0; i < attempts; i++) {
		try {
			return await getJson<T>(url);
		} catch (e) {
			if (i === attempts - 1 || !isRetryable(e)) {
				const s = parseStatus(e);
				const err: StatusError = new Error(
					s === 429
						? "Too Many Requests (429)"
						: ((e as Error)?.message ?? "Request failed"),
				);
				err.status = s;
				throw err;
			}
			const jitter = Math.floor(Math.random() * 120);
			await sleep(baseDelay * 2 ** i + jitter);
		}
	}

	throw new Error("Unexpected retry logic break");
}

async function fetchAllLimited<T>(
	urls: string[],
	worker: (u: string) => Promise<T>,
	limit = 2,
	gapMs = 100,
): Promise<T[]> {
	if (urls.length === 0) {
		return [];
	}
	const out: T[] = [];
	let idx = 0;

	async function run(): Promise<void> {
		const myIdx = idx++;
		if (myIdx >= urls.length) {
			return;
		}
		const u = urls[myIdx] as string;
		try {
			const v = await worker(u);
			out.push(v);
		} catch {}
		await sleep(gapMs);
		await run();
	}

	const runners = Array.from({ length: Math.min(limit, urls.length) }, () =>
		run(),
	);
	await Promise.all(runners);
	return out;
}

type BackFrom = { pathname: string; search?: string };
type BackState = { from?: BackFrom };

/** Person details page. Loads person → films → starships and renders the graph. */
export default function PersonDetails() {
	const { id } = useParams<{ id: string }>();
	const location = useLocation();

	const [person, setPerson] = useState<Person | null>(null);
	const [films, setFilms] = useState<Film[]>([]);
	const [starships, setStarships] = useState<Starship[]>([]);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!id) {
			return;
		}

		let cancelled = false;

		(async () => {
			try {
				setLoading(true);
				setErrorMsg(null);

				const base =
					(import.meta.env.VITE_SW_API_BASE as string | undefined) ?? "/api";
				const personURL = `${base.replace(/\/+$/, "")}/people/${id}/`;

				const p = await loadWithRetry<Person>(personURL);
				if (cancelled) {
					return;
				}
				setPerson(p);

				const filmUrls = Array.from(new Set(mapRefs(base, "films", p.films)));
				const shipUrls = Array.from(
					new Set(mapRefs(base, "starships", p.starships)),
				);

				const [filmsData, starshipsData] = await Promise.all([
					fetchAllLimited(filmUrls, (u) => loadWithRetry<Film>(u), 2, 120),
					fetchAllLimited(shipUrls, (u) => loadWithRetry<Starship>(u), 2, 120),
				]);

				if (cancelled) {
					return;
				}
				setFilms(filmsData);
				setStarships(starshipsData);
			} catch (e) {
				if (!cancelled) {
					const s = parseStatus(e);
					if (s === 429) {
						setErrorMsg(
							"Too many requests to the API (429). Please try again in a few seconds.",
						);
					} else {
						setErrorMsg((e as Error)?.message ?? "Unknown error");
					}
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

	if (loading) {
		return <Loader />;
	}
	if (errorMsg) {
		return <ErrorMessage message={errorMsg} />;
	}
	if (!person) {
		return <ErrorMessage message="Person not found." />;
	}

	const st = (location.state as BackState | null) ?? null;
	const backTo = st?.from ?? { pathname: "/", search: location.search || "" };

	return (
		<section className="grid" aria-label="Person details">
			<div className="toolbar">
				<h2 className="text-xl font-semibold">{title}</h2>
				<Link
					to={backTo}
					className="inline-flex gap-2 items-center btn btn-ghost"
				>
					<svg
						aria-hidden="true"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
					>
						<path
							d="M15 6l-6 6 6 6"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
					Back to list
				</Link>
			</div>

			<div className="overflow-hidden p-0 card" style={{ height: 560 }}>
				<Suspense fallback={<Loader />}>
					<GraphView person={person} films={films} starships={starships} />
				</Suspense>
			</div>
		</section>
	);
}
