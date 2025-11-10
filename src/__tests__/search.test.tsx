import PeopleList from "@features/people/PeopleList";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";

function LocationSpy() {
	const loc = useLocation();
	return <div data-testid="loc-search">{loc.search}</div>;
}

function renderWithProviders(initialEntry: string = "/?page=1") {
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});

	render(
		<MemoryRouter initialEntries={[initialEntry]}>
			<QueryClientProvider client={client}>
				<LocationSpy />
				<PeopleList />
			</QueryClientProvider>
		</MemoryRouter>,
	);
}

it("filters via search and updates URL", async () => {
	renderWithProviders();

	const user = userEvent.setup();

	const input = await screen.findByRole("searchbox");
	await user.clear(input);
	await user.type(input, "leia");

	await waitFor(() =>
		expect(screen.getAllByRole("link", { name: /View details/i })).toHaveLength(
			1,
		),
	);

	expect(screen.getByText(/Leia Organa/i)).toBeInTheDocument();

	const searchText = screen.getByTestId("loc-search").textContent ?? "";
	expect(searchText).toMatch(/q=leia/i);

	expect(screen.queryByText(/Luke Skywalker/i)).not.toBeInTheDocument();
});
