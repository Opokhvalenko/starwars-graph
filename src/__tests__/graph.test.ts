import { buildGraph } from "@features/person/graph";
import { FILM_1, PERSON_1, STARSHIP_12 } from "../test/fixtures";

describe("buildGraph", () => {
	it("creates layered graph with correct edges", () => {
		const g = buildGraph(PERSON_1, [FILM_1], [STARSHIP_12]);

		// Person node exists
		expect(g.nodes.some((n) => n.data.kind === "person")).toBe(true);

		// Film edge from person
		expect(
			g.edges.some(
				(e) => e.source.startsWith("person-") && e.target.startsWith("film-"),
			),
		).toBe(true);

		// Starship edge from film to starship
		expect(
			g.edges.some(
				(e) => e.source.startsWith("film-") && e.target.startsWith("starship-"),
			),
		).toBe(true);
	});
});
