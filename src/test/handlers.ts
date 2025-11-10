import { HttpResponse, http } from "msw";
import { findFilmById, findShipById, listPeoplePage } from "./fixtures";

// Handlers match ANY origin thanks to the "*/" prefix.
// So both "https://sw-api.starnavi.io" and "http://localhost:8787/api" are intercepted.
export const handlers = [
	// People list (supports ?page=&search=)
	http.get("*/people/", ({ request }) => {
		const url = new URL(request.url);
		const page = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
		const search = url.searchParams.get("search");
		const payload = listPeoplePage(Number.isNaN(page) ? 1 : page, search);
		return HttpResponse.json(payload);
	}),

	// Films by id
	http.get("*/films/:id/", ({ params }) => {
		const id = Number.parseInt(String(params.id), 10);
		const film = findFilmById(id);
		if (!film) {
			return HttpResponse.json({ detail: "Not found" }, { status: 404 });
		}
		return HttpResponse.json(film);
	}),

	// Starships by id
	http.get("*/starships/:id/", ({ params }) => {
		const id = Number.parseInt(String(params.id), 10);
		const ship = findShipById(id);
		if (!ship) {
			return HttpResponse.json({ detail: "Not found" }, { status: 404 });
		}
		return HttpResponse.json(ship);
	}),
];
