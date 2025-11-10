import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/routes";
import { ThemeManager } from "./lib/theme";

import "./styles/index.css";

const root = document.getElementById("root");
if (!root) {
	throw new Error("Root container not found.");
}

ThemeManager.applySavedTheme();

const qc = new QueryClient({
	defaultOptions: {
		queries: { retry: 0, staleTime: 30_000 },
	},
});

ReactDOM.createRoot(root).render(
	<React.StrictMode>
		<QueryClientProvider client={qc}>
			<RouterProvider router={router} />
		</QueryClientProvider>
	</React.StrictMode>,
);
