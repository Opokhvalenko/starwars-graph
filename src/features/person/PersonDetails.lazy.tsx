import ErrorMessage from "@components/ErrorMessage";
import Loader from "@components/Loader";
import { lazy, Suspense } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { usePersonDetails } from "./usePersonDetails";

const GraphView = lazy(() => import("./GraphView.lazy"));

type BackFrom = { pathname: string; search?: string };
type BackState = { from?: BackFrom };

export default function PersonDetails() {
	const { id } = useParams<{ id: string }>();
	const location = useLocation();
	const { person, films, starships, loading, error, title } =
		usePersonDetails(id);

	if (loading) {
		return <Loader />;
	}
	if (error) {
		return <ErrorMessage message={error} />;
	}
	if (!person) {
		return <ErrorMessage message="Person not found." />;
	}

	const st = (location.state as BackState | null) ?? null;
	const backTo = st?.from ?? { pathname: "/" };

	return (
		<section className="grid" aria-label="Person details">
			<div className="toolbar">
				<h2 className="text-xl font-semibold">{title}</h2>
				<Link to={backTo} className="inline-flex items-center btn btn-ghost">
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
