import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";

type Opts = {
	route?: string;
	queryClient?: QueryClient;
};

export function renderWithProviders(ui: ReactElement, opts: Opts = {}) {
	const client =
		opts.queryClient ??
		new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});

	const route = opts.route ?? "/";

	return render(
		<MemoryRouter initialEntries={[route]}>
			<QueryClientProvider client={client}>{ui}</QueryClientProvider>
		</MemoryRouter>,
	);
}
