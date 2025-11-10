import type { Person } from "@api/types";
import { memo } from "react";
import { Link, useLocation } from "react-router-dom";
import StarWarsImage from "../features/images/StarWarsImage";

function PersonCardBase({ person }: { person: Person }) {
	const location = useLocation();

	return (
		<article className="overflow-hidden p-0 card group">
			<StarWarsImage
				id={person.id ?? person.url ?? null}
				alt={person.name}
				className="block transition-opacity group-hover:opacity-95"
			/>

			<div className="px-3 pt-2 pb-3">
				<h3 className="text-sm font-medium truncate">{person.name}</h3>

				{person.id !== null ? (
					<Link
						to={{
							pathname: `/person/${person.id}`,
							search: location.search || "",
						}}
						state={{
							from: {
								pathname: location.pathname,
								search: location.search || "",
							},
						}}
						className="inline-flex gap-1 items-center text-sm transition-transform group-hover:translate-x-0.5 hover:underline text-slate-700 underline-offset-2 dark:text-slate-200"
					>
						View details →
					</Link>
				) : (
					<span className="text-sm text-slate-500">No details</span>
				)}
			</div>
		</article>
	);
}

export default memo(PersonCardBase);
