import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

function safeScrollTop() {
	try {
		window.scrollTo?.({ top: 0, behavior: "smooth" });
	} catch {
		/* no-op */
	}
}

const GENDERS = [
	"male",
	"female",
	"hermaphrodite",
	"none",
	"unknown",
	"n/a",
] as const;
type Gender = (typeof GENDERS)[number];

export default function AdvancedFilters() {
	const [params, setParams] = useSearchParams();
	const qc = useQueryClient();

	const [nameContains, setNameContains] = useState<string>(
		params.get("name__contains") ?? "",
	);
	const [selectedGenders, setSelectedGenders] = useState<Gender[]>(
		(params.get("gender__in") ?? "")
			.split(",")
			.map((g) => g.trim())
			.filter((g): g is Gender => (GENDERS as readonly string[]).includes(g)),
	);
	const [heightMin, setHeightMin] = useState<string>("");
	const [heightMax, setHeightMax] = useState<string>("");
	const [eyeContains, setEyeContains] = useState<string>("");
	const [eyeNegate, setEyeNegate] = useState<boolean>(false);

	const hasActive = useMemo(() => {
		return Boolean(
			nameContains?.trim() ||
				selectedGenders.length ||
				(heightMin && heightMax) ||
				eyeContains?.trim(),
		);
	}, [nameContains, selectedGenders, heightMin, heightMax, eyeContains]);

	function toggleGender(g: Gender) {
		setSelectedGenders((prev) =>
			prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g],
		);
	}

	function apply(e?: React.FormEvent) {
		if (e) {
			e.preventDefault();
		}
		const sp = new URLSearchParams(params);

		// name__contains
		if (nameContains?.trim()) {
			sp.set("name__contains", nameContains.trim());
		} else {
			sp.delete("name__contains");
		}

		// gender__in
		if (selectedGenders.length) {
			sp.set("gender__in", selectedGenders.join(","));
		} else {
			sp.delete("gender__in");
		}

		// height__range
		if (heightMin && heightMax) {
			sp.set("height__range", `${heightMin},${heightMax}`);
		} else {
			sp.delete("height__range");
		}

		// eye_color__contains (+negate)
		sp.delete("eye_color__contains");
		sp.delete("eye_color__contains!=");
		if (eyeContains?.trim()) {
			if (eyeNegate) {
				sp.set("eye_color__contains!=", eyeContains.trim());
			} else {
				sp.set("eye_color__contains", eyeContains.trim());
			}
		}

		sp.set("page", "1");

		setParams(sp, { replace: true });

		requestAnimationFrame(() => {
			void qc.invalidateQueries({
				queryKey: ["people"],
				exact: false,
				refetchType: "active",
			});
		});

		safeScrollTop();
	}

	function reset() {
		const sp = new URLSearchParams(params);
		[
			"name__contains",
			"gender__in",
			"height__range",
			"eye_color__contains",
			"eye_color__contains!=",
		].forEach((k) => {
			sp.delete(k);
		});
		sp.set("page", "1");
		setParams(sp, { replace: true });

		setNameContains("");
		setSelectedGenders([]);
		setHeightMin("");
		setHeightMax("");
		setEyeContains("");
		setEyeNegate(false);

		requestAnimationFrame(() => {
			void qc.invalidateQueries({
				queryKey: ["people"],
				exact: false,
				refetchType: "active",
			});
		});

		safeScrollTop();
	}

	return (
		<details
			className="p-4 rounded-xl border shadow-sm dark:border-gray-700"
			open
		>
			<summary className="text-sm font-medium cursor-pointer select-none">
				Advanced filters
				{hasActive && (
					<span className="py-0.5 px-2 ml-2 text-xs text-white bg-blue-600 rounded">
						active
					</span>
				)}
			</summary>

			<form onSubmit={apply}>
				<div className="grid gap-4 mt-4 md:grid-cols-2">
					{/* Name contains */}
					<label className="flex flex-col gap-1">
						<span className="text-sm">Name contains</span>
						<input
							type="text"
							placeholder="e.g. sky"
							className="px-3 h-10 rounded-lg border dark:bg-gray-800 dark:border-gray-700"
							value={nameContains}
							onChange={(e) => setNameContains(e.target.value)}
						/>
					</label>

					{/* Gender multi */}
					<fieldset className="flex flex-col gap-2">
						<legend className="text-sm">Gender (multi)</legend>
						<div className="flex flex-wrap gap-2">
							{GENDERS.map((g) => {
								const active = selectedGenders.includes(g);
								return (
									<button
										key={g}
										type="button"
										aria-pressed={active}
										onClick={() => toggleGender(g)}
										className={[
											"h-9 rounded-lg border px-3 text-sm transition",
											active
												? "border-blue-600 bg-blue-600 text-white"
												: "hover:bg-gray-100 dark:hover:bg-gray-700",
										].join(" ")}
									>
										{g}
									</button>
								);
							})}
						</div>
					</fieldset>

					{/* Height range */}
					<div className="grid grid-cols-2 gap-2">
						<label className="flex flex-col gap-1">
							<span className="text-sm">Height min (cm)</span>
							<input
								type="number"
								inputMode="numeric"
								placeholder="e.g. 100"
								className="px-3 h-10 rounded-lg border dark:bg-gray-800 dark:border-gray-700"
								value={heightMin}
								onChange={(e) => setHeightMin(e.target.value)}
							/>
						</label>
						<label className="flex flex-col gap-1">
							<span className="text-sm">Height max (cm)</span>
							<input
								type="number"
								inputMode="numeric"
								placeholder="e.g. 200"
								className="px-3 h-10 rounded-lg border dark:bg-gray-800 dark:border-gray-700"
								value={heightMax}
								onChange={(e) => setHeightMax(e.target.value)}
							/>
						</label>
						<p className="col-span-2 text-xs text-gray-600 dark:text-gray-300">
							Range applies only if both min and max are set.
						</p>
					</div>

					{/* Eye color contains (+ negate) */}
					<div className="grid gap-2">
						<label className="flex flex-col gap-1">
							<span className="text-sm">Eye color contains</span>
							<input
								type="text"
								placeholder="e.g. blue"
								className="px-3 h-10 rounded-lg border dark:bg-gray-800 dark:border-gray-700"
								value={eyeContains}
								onChange={(e) => setEyeContains(e.target.value)}
							/>
						</label>
						<label className="inline-flex gap-2 items-center text-sm">
							<input
								className="w-4 h-4"
								type="checkbox"
								checked={eyeNegate}
								onChange={(e) => setEyeNegate(e.target.checked)}
							/>
							Exclude matches (negate)
						</label>
					</div>
				</div>

				<div className="flex gap-2 items-center mt-4">
					<button
						type="submit"
						className="px-4 h-10 text-sm rounded-lg border hover:bg-gray-100 dark:hover:bg-gray-700"
					>
						Apply
					</button>
					<button
						type="button"
						onClick={reset}
						className="px-4 h-10 text-sm rounded-lg border hover:bg-gray-100 dark:hover:bg-gray-700"
					>
						Reset
					</button>
				</div>
			</form>
		</details>
	);
}
