import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			"@app": path.resolve(__dirname, "src/app"),
			"@api": path.resolve(__dirname, "src/api"),
			"@lib": path.resolve(__dirname, "src/lib"),
			"@components": path.resolve(__dirname, "src/components"),
			"@features": path.resolve(__dirname, "src/features"),
			"@test": path.resolve(__dirname, "src/test"),
		},
	},
	server: {
		proxy: {
			"/api": {
				target: "https://sw-api.starnavi.io",
				changeOrigin: true,
				secure: true,
				rewrite: (p) => p.replace(/^\/api/, ""),
			},
		},
	},
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["src/test/setup.ts"],
		exclude: [
			"node_modules/**",
			"dist/**",
			"src/test/tests/e2e/**",
			"tests/e2e/**",
			"**/*.e2e.*",
			"**/e2e/**",
		],
	},
	build: {
		sourcemap: false,
		assetsInlineLimit: 4096,
		rollupOptions: {
			output: {
				manualChunks: {
					vendor: ["react", "react-dom", "react-router-dom"],
					reactflow: ["reactflow"],
				},
			},
		},
	},
	define: {
		__APP_VERSION__: JSON.stringify("1.0.0"),
	},
});
