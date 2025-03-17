import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		exclude: [
			"node_modules/**",
			"tests/e2e/**",
			"**/*.spec.js",
			"**/*.spec.ts",
			"vitest.config.js",
			"coverage/",
		],
		testTimeout: 60000,
		hookTimeout: 30000,
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			exclude: [
				"node_modules/",
				"test/",
				"**/*.test.js",
				"vitest.config.js",
				"coverage/",
			],
		},
	},
});
