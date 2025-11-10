import { defineConfig } from "@playwright/test";

export default defineConfig({
	// point to your actual folder
	testDir: "src/test/tests/e2e",
	use: {
		baseURL: "http://localhost:4173",
		headless: true,
	},
	webServer: {
		command: "npm run preview",
		port: 4173,
		reuseExistingServer: !process.env.CI,
	},
});
