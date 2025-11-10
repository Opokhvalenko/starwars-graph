import { getJson } from "@api/http";
import { mapRefs } from "@api/normalize";
import type { Film, Person, Starship } from "@api/types";
import ErrorMessage from "@components/ErrorMessage";
import Loader from "@components/Loader";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

const GraphView = lazy(() => import("./GraphView.lazy"));

async function loadByUrl<T>(url: string): Promise<T> {
	return getJson<T>(url);
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
		let ignore = false;

		async function run() {
			try {
				setLoading(true);
				setErrorMsg(null);

				const base =
					(import.meta.env.VITE_SW_API_BASE as string | undefined) ?? "/api";

				const personURL = `${base.replace(/\/+$/, "")}/people/${id}/`;
				const p = await loadByUrl<Person>(personURL);

				const filmUrls: string[] = mapRefs(base, "films", p.films);
				const shipUrls: string[] = mapRefs(base, "starships", p.starships);

				const [filmsData, starshipsData] = await Promise.all([
					Promise.all(filmUrls.map((u) => loadByUrl<Film>(u))),
					Promise.all(shipUrls.map((u) => loadByUrl<Starship>(u))),
				]);

				if (!ignore) {
					setPerson(p);
					setFilms(filmsData);
					setStarships(starshipsData);
				}
			} catch (e) {
				setErrorMsg(e instanceof Error ? e.message : "Unknown error");
			} finally {
				if (!ignore) {
					setLoading(false);
				}
			}
		}

		run();
		return () => {
			ignore = true;
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

	// Fallback if opened directly
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

			{/* wrapper without test id */}
			<div className="overflow-hidden p-0 card" style={{ height: 560 }}>
				<Suspense fallback={<Loader />}>
					<GraphView person={person} films={films} starships={starships} />
				</Suspense>
			</div>
		</section>
	);
}
