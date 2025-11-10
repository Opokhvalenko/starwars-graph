// Attach jest-dom matchers
import "@testing-library/jest-dom";

import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { handlers } from "./handlers";

// MSW: block real network requests during tests
export const server = setupServer(...handlers);

beforeAll(() => {
	server.listen({ onUnhandledRequest: "error" });

	// Minimal IntersectionObserver stub for JSDOM
	type MinimalEntry = { isIntersecting: boolean };
	Object.defineProperty(global, "IntersectionObserver", {
		writable: true,
		value: class {
			constructor(callback: (entries: MinimalEntry[]) => void) {
				setTimeout(() => callback([{ isIntersecting: false }]), 0);
			}
			observe() {}
			unobserve() {}
			disconnect() {}
			takeRecords() {
				return [];
			}
		},
	});

	// Mock matchMedia for JSDOM
	Object.defineProperty(window, "matchMedia", {
		writable: true,
		value: vi.fn().mockImplementation((query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: vi.fn(), // legacy
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		})),
	});
});

afterEach(() => {
	server.resetHandlers();
	vi.restoreAllMocks();
});

afterAll(() => server.close());
