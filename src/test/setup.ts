// 1. jest-dom matchers
import "@testing-library/jest-dom";

import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { handlers } from "./handlers";

vi.stubEnv("VITE_SW_API_BASE", "/api");

// 2. create MSW server with base handlers
const server = setupServer(...handlers);

// 3. run server before tests
beforeAll(() => {
	// block ALL real HTTP — important for test task
	server.listen({ onUnhandledRequest: "error" });

	// ---- jsdom polyfills ----

	// IntersectionObserver (already was)
	type MinimalEntry = { isIntersecting: boolean };
	Object.defineProperty(globalThis, "IntersectionObserver", {
		writable: true,
		value: class {
			// eslint-disable-next-line @typescript-eslint/no-useless-constructor
			constructor(callback: (entries: MinimalEntry[]) => void) {
				// fire once so components that wait for it don't hang
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

	// ✅ ResizeObserver — React Flow needs this in tests
	Object.defineProperty(globalThis, "ResizeObserver", {
		writable: true,
		value: class {
			observe() {}
			unobserve() {}
			disconnect() {}
		},
	});

	// matchMedia mock (for theme / prefers-color-scheme)
	Object.defineProperty(window, "matchMedia", {
		writable: true,
		value: vi.fn().mockImplementation((query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: vi.fn(), // deprecated
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		})),
	});
});

// 4. reset handlers between tests
afterEach(() => {
	server.resetHandlers();
	vi.restoreAllMocks();
});

// 5. close server when test run ends
afterAll(() => server.close());

// 6. IMPORTANT: export for tests (personDetails.test.tsx imports this)
export { server };
