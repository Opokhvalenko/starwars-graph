import ErrorBoundary from "@components/ErrorBoundary";
import Layout from "@components/Layout";
import Loader from "@components/Loader";
import PeopleList from "@features/people/PeopleList";
import { lazy, Suspense } from "react";
import { createBrowserRouter, Outlet } from "react-router-dom";

const PersonDetails = lazy(() => import("@features/person/PersonDetails.lazy"));

function RootRoute() {
	return (
		<Layout>
			<ErrorBoundary>
				<Outlet />
			</ErrorBoundary>
		</Layout>
	);
}

export const router = createBrowserRouter(
	[
		{
			path: "/",
			element: <RootRoute />,
			children: [
				{ index: true, element: <PeopleList /> },
				{
					path: "person/:id",
					element: (
						<Suspense fallback={<Loader />}>
							<PersonDetails />
						</Suspense>
					),
				},
				{ path: "*", element: <div className="badge">Not found</div> },
			],
		},
	],
	{
		future: {
			v7_relativeSplatPath: true,
			v7_fetcherPersist: true,
			v7_normalizeFormMethod: true,
			v7_partialHydration: true,
			v7_skipActionErrorRevalidation: true,
		},
	},
);
