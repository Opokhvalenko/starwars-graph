import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import PersonDetails from "../features/person/PersonDetails.lazy";
import { server } from "../test/setup";

function renderWithProviders(path = "/person/1") {
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	return render(
		<MemoryRouter initialEntries={[path]}>
			<QueryClientProvider client={client}>
				<Routes>
					<Route path="/person/:id" element={<PersonDetails />} />
				</Routes>
			</QueryClientProvider>
		</MemoryRouter>,
	);
}

const PERSON = {
	url: "/api/people/1/",
	name: "Luke Skywalker",
	films: ["/api/films/1/"],
	starships: ["/api/starships/10/"],
};

const FILM = {
	url: "/api/films/1/",
	title: "A New Hope",
	starships: ["/api/starships/10/"],
};

const STARSHIP = {
	url: "/api/starships/10/",
	name: "Millennium Falcon",
};

describe("PersonDetails", () => {
	beforeEach(() => {
		server.use(
			http.get("/api/people/:id/", () => HttpResponse.json(PERSON)),
			http.get("/api/films/:id/", () => HttpResponse.json(FILM)),
			http.get("/api/starships/:id/", () => HttpResponse.json(STARSHIP)),
		);
	});

	it("loads person and renders graph", async () => {
		renderWithProviders();
		// initial loader
		expect(screen.getByRole("status")).toBeInTheDocument();
		// graph should appear (container from GraphView)
		expect(await screen.findByTestId("graph-flow")).toBeVisible();
	});
});
