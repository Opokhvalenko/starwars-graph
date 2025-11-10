import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PeopleList from "../features/people/PeopleList";

function renderPage(initial = "/?page=1") {
	const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
	render(
		<QueryClientProvider client={qc}>
			<MemoryRouter initialEntries={[initial]}>
				<PeopleList />
			</MemoryRouter>
		</QueryClientProvider>,
	);
}

describe("Advanced filters → server params", () => {
	const searches: string[] = [];

	beforeEach(() => {
		// jsdom: no scrollTo
		vi.spyOn(window, "scrollTo").mockImplementation(() => {});

		const realFetch: typeof fetch = global.fetch as typeof fetch;

		vi.spyOn(global, "fetch").mockImplementation(
			(input: RequestInfo | URL, init?: RequestInit) => {
				try {
					const url =
						typeof input === "string"
							? input
							: input instanceof URL
								? input.toString()
								: (input as Request).url;
					if (typeof url === "string" && url.includes("/people/")) {
						searches.push(new URL(url).search);
					}
				} catch {
					/* ignore */
				}
				return realFetch(input, init);
			},
		);

		searches.length = 0;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("forwards name__contains and gender__in to API", async () => {
		renderPage("/?page=1");
		fireEvent.click(screen.getByText(/advanced filters/i));
		fireEvent.change(screen.getByPlaceholderText(/e\.g\. sky/i), {
			target: { value: "sky" },
		});
		fireEvent.click(screen.getByRole("button", { name: "male" }));
		fireEvent.click(screen.getByRole("button", { name: /apply/i }));

		await waitFor(() => {
			const last = searches.at(-1) ?? "";
			expect(last).toContain("name__contains=sky");
			expect(last).toContain("gender__in=male");
			expect(last).toContain("page=1");
		});
	});
});
