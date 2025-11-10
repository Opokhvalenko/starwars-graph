const BASE = (
	(import.meta.env.VITE_SW_API_BASE as string) ?? "https://sw-api.starnavi.io"
).replace(/\/+$/, "");

export const Endpoints = {
	peoplePage: (page: number) => `${BASE}/people/?page=${page}`,
} as const;
