import { expect, test } from "@playwright/test";

// 1x1 PNG used to mock external images to keep tests fast and deterministic
const ONE_BY_ONE_PNG = Buffer.from(
	"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHWgKk3VtR+QAAAABJRU5ErkJggg==",
	"base64",
);

test("home renders people and details graph flow (all network mocked)", async ({
	page,
}) => {
	// Global request routing: block real network, serve JSON/image fixtures
	await page.route("**/*", async (route) => {
		const req = route.request();
		const url = new URL(req.url());
		const path = url.pathname;

		// Allow HTML and static assets through
		if (
			req.resourceType() === "document" ||
			path.startsWith("/assets/") ||
			path.startsWith("/@fs/") ||
			path.includes("/node_modules/")
		) {
			await route.continue();
			return;
		}

		// --- API fixtures ---

		// People list: */people/?page=1&search=...
		if (path.endsWith("/people/")) {
			const payload = {
				count: 2,
				next: null,
				previous: null,
				results: [
					{
						name: "Luke Skywalker",
						url: "https://sw-api.starnavi.io/people/1/",
						films: ["https://sw-api.starnavi.io/films/1/"],
						starships: ["https://sw-api.starnavi.io/starships/12/"],
					},
					{
						name: "Leia Organa",
						url: "https://sw-api.starnavi.io/people/5/",
						films: ["https://sw-api.starnavi.io/films/1/"],
						starships: [],
					},
				],
			};
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(payload),
			});
			return;
		}

		// Person details: */people/:id/
		if (/\/people\/\d+\/$/.test(path)) {
			const idStr = path.split("/").filter(Boolean).pop(); // "1"
			const id = Number(idStr);
			const luke = {
				name: "Luke Skywalker",
				url: "https://sw-api.starnavi.io/people/1/",
				films: ["https://sw-api.starnavi.io/films/1/"],
				starships: ["https://sw-api.starnavi.io/starships/12/"],
			};
			const leia = {
				name: "Leia Organa",
				url: "https://sw-api.starnavi.io/people/5/",
				films: ["https://sw-api.starnavi.io/films/1/"],
				starships: [],
			};
			const payload = id === 1 ? luke : id === 5 ? leia : null;
			if (!payload) {
				await route.fulfill({
					status: 404,
					contentType: "application/json",
					body: JSON.stringify({ detail: "Not found" }),
				});
				return;
			}
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(payload),
			});
			return;
		}

		// Film: */films/:id/
		if (/\/films\/\d+\/$/.test(path)) {
			const payload = {
				title: "A New Hope",
				url: "https://sw-api.starnavi.io/films/1/",
				starships: ["https://sw-api.starnavi.io/starships/12/"],
				characters: [
					"https://sw-api.starnavi.io/people/1/",
					"https://sw-api.starnavi.io/people/5/",
				],
			};
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(payload),
			});
			return;
		}

		// Starship: */starships/:id/
		if (/\/starships\/\d+\/$/.test(path)) {
			const payload = {
				name: "X-wing",
				url: "https://sw-api.starnavi.io/starships/12/",
				films: ["https://sw-api.starnavi.io/films/1/"],
				pilots: ["https://sw-api.starnavi.io/people/1/"],
			};
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(payload),
			});
			return;
		}

		// External images: short-circuit to tiny PNG to avoid real network
		if (url.hostname === "starwars-visualguide.com") {
			await route.fulfill({
				status: 200,
				contentType: "image/png",
				body: ONE_BY_ONE_PNG,
			});
			return;
		}

		// Anything else is not expected in this flow
		await route.fulfill({ status: 404, body: "Not Found" });
	});

	// Open the app (SPA-friendly)
	await page.goto("/", { waitUntil: "domcontentloaded" });

	// There are multiple "View details" links on the list, take the first
	const detailsLinks = page.getByRole("link", { name: /View details/i });
	await expect(detailsLinks.first()).toBeVisible();

	// Start waiting for URL change BEFORE the click to avoid race conditions
	await Promise.all([
		detailsLinks.first().click(),
		expect(page).toHaveURL(/\/person\/\d+\/?$/),
	]);

	// Graph container should appear
	await expect(page.getByTestId("graph-flow")).toBeVisible();

	// React Flow should render at least one node
	await expect(
		page.locator('[data-testid="graph-flow"] .react-flow__node').first(),
	).toBeVisible();

	// Sanity check: film title appears inside the graph
	await expect(page.getByText(/A New Hope/i)).toBeVisible();
});
