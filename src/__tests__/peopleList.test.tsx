import PeopleList from "@features/people/PeopleList";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

function renderWithProviders(route = "/?page=1") {
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	return render(
		<MemoryRouter initialEntries={[route]}>
			<QueryClientProvider client={client}>
				<PeopleList />
			</QueryClientProvider>
		</MemoryRouter>,
	);
}

describe("PeopleList", () => {
	it("renders first page and shows loader then results", async () => {
		renderWithProviders();

		expect(screen.getByRole("status")).toHaveTextContent(/loading/i);

		const links = await screen.findAllByRole("link", { name: /View details/i });
		expect(links.length).toBeGreaterThan(0);

		expect(screen.getByText(/Luke Skywalker/i)).toBeInTheDocument();
		expect(screen.getByText(/Leia Organa/i)).toBeInTheDocument();
	});
});
