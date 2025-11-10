import { extractId } from "@lib/id";

describe("extractId", () => {
	it("extracts numeric id from resource URL", () => {
		expect(extractId("https://sw-api.starnavi.io/people/1/")).toBe(1);
		expect(extractId("https://sw-api.starnavi.io/starships/12")).toBe(12);
	});

	it("throws on invalid URL", () => {
		expect(() => extractId("https://sw-api.starnavi.io/people/")).toThrow();
	});
});
