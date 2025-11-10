import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Loader from "../../components/Loader";
import PersonCard from "../../components/PersonCard";
import { fetchPeople, type PeopleResp } from "./api";
import SearchBar from "./SearchBar";

const SKELETON_KEYS = Array.from({ length: 8 }, (_, i) => `skeleton-${i}`);

export default function PeopleList() {
	const [params, setParams] = useSearchParams();
	const page = Math.max(1, Number(params.get("page") ?? "1"));
	const q = (params.get("q") ?? "").trim() || null;

	const { data, isPending, isError, refetch, isFetching } = useQuery<
		PeopleResp,
		Error
	>({
		queryKey: ["people", { page, q }],
		queryFn: () => fetchPeople(page, q),
		staleTime: 30_000,
		placeholderData: keepPreviousData,
	});

	useEffect(() => {
		if (q && page !== 1) {
			const next = new URLSearchParams(params);
			next.set("page", "1");
			setParams(next, { replace: true });
		}
	}, [q, page, params, setParams]);

	if (isError) {
		return (
			<div className="px-4 mx-auto max-w-7xl">
				<p className="text-red-600 dark:text-red-400">Failed to load people.</p>
				<button
					type="button"
					className="py-2 px-3 mt-2 rounded-xl border"
					onClick={() => refetch()}
				>
					Retry
				</button>
			</div>
		);
	}

	if (isPending && !data) {
		return (
			<div className="px-4 mx-auto max-w-7xl">
				<SearchBar />
				<div className="sr-only">
					<Loader />
				</div>

				<div className="grid grid-cols-1 gap-4 mt-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
					{SKELETON_KEYS.map((k) => (
						<div key={k} className="h-64 animate-pulse card" />
					))}
				</div>
			</div>
		);
	}

	const results = data?.results ?? [];
	const noMore = results.length === 0;

	return (
		<div className="px-4 mx-auto max-w-7xl">
			<SearchBar />
			<div className="grid grid-cols-1 gap-4 mt-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
				{results.map((p) => (
					<PersonCard key={p.id ?? p.url} person={p} />
				))}
			</div>

			<div className="flex gap-2 justify-center items-center my-6">
				<button
					type="button"
					className="btn btn-soft"
					onClick={() =>
						setParams({ page: String(Math.max(1, page - 1)), q: q ?? "" })
					}
					disabled={page <= 1 || isFetching}
				>
					Prev
				</button>
				<span className="text-sm opacity-70">Page {page}</span>
				<button
					type="button"
					className="btn btn-soft"
					onClick={() => setParams({ page: String(page + 1), q: q ?? "" })}
					disabled={isFetching || noMore}
				>
					Next
				</button>
			</div>
		</div>
	);
}
