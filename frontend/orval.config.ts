import { defineConfig } from "orval";

export default defineConfig({
	mcp: {
		input: {
			target:
				"https://raw.githubusercontent.com/modelcontextprotocol/registry/refs/tags/v1.0.0/docs/reference/api/openapi.yaml",
		},
		output: {
			baseUrl: "https://registry.modelcontextprotocol.io",
			client: "fetch",
			target: "src/features/server/lib/api.generated.ts",
		},
	},
});
