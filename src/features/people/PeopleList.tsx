import {
	keepPreviousData,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import type { Person } from "../../api/types";
import AdvancedFilters from "./AdvancedFilters";
import { fetchPeople } from "./api";
import SearchBar from "./SearchBar";

function safeScrollTop() {
	try {
		window.scrollTo?.({ top: 0, behavior: "smooth" });
	} catch {
		/* no-op */
	}
}

function buildRequestParams(
	params: URLSearchParams,
	page: number,
): URLSearchParams {
	const sp = new URLSearchParams(params);
	sp.set("page", String(page));
	return sp;
}

function extractIdFromUrl(url?: string | null): number | null {
	if (!url) {
		return null;
	}
	const m = String(url).match(/\/(\d+)\/?$/);
	return m ? Number(m[1]) : null;
}

function personIdStrict(
	p: Person | { id?: unknown; url?: string | null },
	idx: number,
): number {
	const direct = (p as Person).id;
	if (typeof direct === "number" && Number.isFinite(direct)) {
		return direct;
	}

	const fromUrl = extractIdFromUrl((p as { url?: string | null }).url ?? null);
	return fromUrl ?? idx + 1;
}

const IMG_BASE = (import.meta.env.VITE_SW_IMG_BASE as string) ?? "/img";

function Avatar({ id, name }: { id: number | string; name: string }) {
	const [error, setError] = useState(false);
	const initials = name
		.split(" ")
		.map((p) => p[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();

	if (error) {
		return (
			<div className="flex justify-center items-center w-20 h-20 text-xl font-semibold text-gray-600 bg-gray-100 rounded-xl border dark:text-gray-200 dark:bg-gray-800 dark:border-gray-700">
				{initials}
			</div>
		);
	}

	return (
		<img
			src={`${IMG_BASE}/people/${id}.jpg`}
			alt={name}
			width={80}
			height={80}
			loading="lazy"
			onError={() => setError(true)}
			className="object-cover w-20 h-20 rounded-xl border dark:border-gray-700"
		/>
	);
}

export default function PeopleList() {
	const [params, setParams] = useSearchParams();
	const location = useLocation();
	const queryClient = useQueryClient();

	const page = useMemo<number>(() => {
		const raw = Number(params.get("page") ?? "1");
		return Number.isFinite(raw) && raw > 0 ? raw : 1;
	}, [params]);

	const reqParams = useMemo(
		() => buildRequestParams(params, page),
		[params, page],
	);
	const reqKey = useMemo(() => reqParams.toString(), [reqParams]);
	const queryKey = useMemo(() => ["people", reqKey], [reqKey]);

	const { data, isPending, isFetching, isError, error, refetch } = useQuery({
		queryKey,
		queryFn: () => fetchPeople(reqParams),
		placeholderData: keepPreviousData,
	});

	useEffect(() => {
		void refetch();
	}, [refetch]);

	const results = (data?.results ?? []) as Person[];
	const canPrev = Boolean(data?.previous);
	const canNext = Boolean(data?.next);

	useEffect(() => {
		if (!data?.next) {
			return;
		}
		const nextParams = new URLSearchParams(reqParams);
		nextParams.set("page", String(page + 1));
		const nextKey = ["people", nextParams.toString()];
		void queryClient.prefetchQuery({
			queryKey: nextKey,
			queryFn: () => fetchPeople(nextParams),
		});
	}, [data?.next, page, reqParams, queryClient]);

	const goToPage = (newPage: number) => {
		if (newPage < 1) {
			return;
		}
		const sp = new URLSearchParams(params);
		sp.set("page", String(newPage));
		setParams(sp);
		safeScrollTop();
	};

	const searchStr = `?${reqKey}`;

	return (
		<section
			className="py-6 px-4 mx-auto max-w-5xl"
			aria-busy={isFetching ? "true" : "false"}
			aria-describedby="people-loading"
		>
			<header className="mb-6">
				<h1 className="text-2xl font-semibold tracking-tight">
					Star Wars — People
				</h1>

				<div className="flex flex-col gap-4 mt-4">
					<SearchBar />
					<AdvancedFilters />
				</div>

				<div className="flex gap-3 justify-between items-center mt-4">
					<p className="text-sm text-gray-600 dark:text-gray-300">
						{data?.count != null ? (
							<>
								<span className="font-medium">{data.count}</span> total results
							</>
						) : (
							"Results"
						)}
					</p>
				</div>
			</header>

			{/* Loading / Error */}
			{isPending && (
				<output
					id="people-loading"
					aria-live="polite"
					className="p-6 mt-8 text-sm text-gray-600 rounded-xl border dark:text-gray-300"
				>
					Loading people…
				</output>
			)}

			{isError && (
				<div className="p-6 mt-8 text-sm text-red-800 bg-red-50 rounded-xl border border-red-300 dark:text-red-200 dark:border-red-700 dark:bg-red-900/30">
					<p className="mb-3">
						Failed to load people
						{(error as Error)?.message ? `: ${(error as Error).message}` : ""}.
					</p>
					<button
						type="button"
						onClick={() => refetch()}
						className="py-2 px-3 text-sm rounded-lg border hover:bg-red-100 dark:hover:bg-red-800"
					>
						Retry
					</button>
				</div>
			)}

			{/* Results */}
			{!isPending && !isError && (
				<>
					{results.length === 0 ? (
						<p className="mt-8 text-sm text-gray-600 dark:text-gray-300">
							No people found.
						</p>
					) : (
						<ul className="grid grid-cols-1 gap-3 mt-4 sm:grid-cols-2">
							{results.map((p, idx) => {
								const pid = personIdStrict(p as Person, idx);

								return (
									<li
										key={pid}
										className="p-4 rounded-2xl border shadow-sm transition dark:border-gray-700 hover:shadow-md"
									>
										<div className="flex gap-3 justify-between items-start">
											<div className="flex gap-4 items-center">
												<Avatar id={pid} name={(p as Person).name} />
												<div>
													<h3 className="text-lg font-medium">
														{(p as Person).name}
													</h3>
													<p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
														ID: {pid}
													</p>
												</div>
											</div>

											<Link
												to={{ pathname: `/person/${pid}`, search: searchStr }}
												state={{ from: location }}
												className="inline-flex items-center px-3 h-9 text-sm rounded-lg border hover:bg-gray-100 dark:hover:bg-gray-700"
											>
												View details
											</Link>
										</div>
									</li>
								);
							})}
						</ul>
					)}

					<nav
						aria-label="Pagination"
						className="flex sticky gap-2 justify-end items-center mt-6 -mb-3"
					>
						<button
							type="button"
							onClick={() => goToPage(page - 1)}
							disabled={!canPrev || isFetching}
							className={[
								"h-10 rounded-lg border px-3 text-sm transition",
								canPrev && !isFetching
									? "bg-white hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
									: "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-400",
							].join(" ")}
						>
							Previous
						</button>
						<span className="text-sm tabular-nums text-center min-w-16">
							Page <strong>{page}</strong>
						</span>
						<button
							type="button"
							onClick={() => goToPage(page + 1)}
							disabled={!canNext || isFetching}
							className={[
								"h-10 rounded-lg border px-3 text-sm transition",
								canNext && !isFetching
									? "bg-white hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
									: "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-400",
							].join(" ")}
						>
							Next
						</button>
					</nav>
				</>
			)}
		</section>
	);
}
