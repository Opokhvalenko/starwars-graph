import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

const DEBOUNCE_MS = 400;

export default function SearchBar() {
	const [sp, setSp] = useSearchParams();

	const urlQ = useMemo(() => (sp.get("q") ?? "").trim(), [sp]);

	const [value, setValue] = useState(urlQ);
	const deferred = useDeferredValue(value);

	const touchedRef = useRef(false);

	useEffect(() => {
		// sync external url → input when user hasn't typed yet
		if (!touchedRef.current) {
			setValue(urlQ);
		}
	}, [urlQ]);

	useEffect(() => {
		const t = setTimeout(() => {
			if (!touchedRef.current) {
				return;
			}
			const q = deferred.trim();
			setSp((prev) => {
				const page = prev.get("page") ?? "1";
				const next = new URLSearchParams(prev);
				next.set("page", page); // keep current page, reset below if q changed
				if (q) {
					next.set("q", q);
				} else {
					next.delete("q");
				}
				// When the query changes, reset to 1
				if (q !== urlQ) {
					next.set("page", "1");
				}
				return next;
			});
		}, DEBOUNCE_MS);
		return () => clearTimeout(t);
	}, [deferred, setSp, urlQ]);

	const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		touchedRef.current = true;
		setValue(e.target.value);
	};

	const onClear = () => {
		touchedRef.current = true;
		setValue("");
		setSp((prev) => {
			const next = new URLSearchParams(prev);
			next.delete("q");
			next.set("page", "1");
			return next;
		});
	};

	return (
		<form className="search-form" aria-label="people search">
			<input
				type="search"
				aria-label="Search people"
				autoComplete="off"
				placeholder="Search people by name…"
				className="input"
				value={value}
				onChange={onChange}
			/>
			{value.length > 0 && (
				<button type="button" onClick={onClear} className="search-clear">
					Clear
				</button>
			)}
		</form>
	);
}
