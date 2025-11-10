/** Extracts numeric id from standard SWAPI-like resource URL. */
export function extractId(resourceUrl: string): number {
	// Example: https://sw-api.starnavi.io/people/1/ -> 1
	const matches = resourceUrl.match(/\/(\d+)\/?$/);
	if (!matches || matches.length < 2 || !matches[1]) {
		throw new Error(`Unable to extract id from URL: ${resourceUrl}`);
	}
	const idPart = matches[1];
	return Number.parseInt(idPart, 10);
}
