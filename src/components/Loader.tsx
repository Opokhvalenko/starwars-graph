/** Simple loader to be used as Suspense fallback and page spinners. */
export default function Loader() {
	return (
		<output className="badge" aria-live="polite" aria-busy="true">
			Loading…
		</output>
	);
}
