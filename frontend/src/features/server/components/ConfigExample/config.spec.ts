import { describe, expect, it } from "bun:test";
import type { Argument, KeyValueInput, Package, Remote } from "../../lib/types";
import { buildPackageConfigExample, buildRemoteConfigExample } from "./config";

describe("buildPackageConfigExample", () => {
	const basePkg = (over: Partial<Package> = {}): Package => ({
		identifier: "example/pkg",
		version: "1.2.3",
		registry_type: "npm",
		runtime_hint: "npx",
		transport: { type: "stdio" },
		...over,
	});

	it("returns null for missing identifier/version or mcpb", () => {
		expect(
			buildPackageConfigExample(basePkg({ identifier: undefined })),
		).toBeNull();
		expect(
			buildPackageConfigExample(basePkg({ version: undefined })),
		).toBeNull();
		expect(
			buildPackageConfigExample(basePkg({ registry_type: "mcpb" })),
		).toBeNull();
	});

	it("builds npx command with package@version", () => {
		const cmd = buildPackageConfigExample(basePkg());
		expect(cmd).toEqual({
			type: "stdio",
			json: {
				type: "stdio",
				command: "npx",
				args: ["-y", "example/pkg@1.2.3"],
				env: undefined,
			},
		});
	});

	it("infers runtime from registry_type when runtime_hint is missing (pypi -> uvx)", () => {
		const cmd = buildPackageConfigExample(
			basePkg({
				runtime_hint: undefined,
				registry_type: "pypi",
				identifier: "weather",
				version: "0.5.0",
			}),
		);
		expect(cmd).toEqual({
			type: "stdio",
			json: {
				type: "stdio",
				command: "uvx",
				args: ["weather@0.5.0"],
				env: undefined,
			},
		});
	});

	it("builds dnx command for nuget", () => {
		const cmd = buildPackageConfigExample(
			basePkg({
				runtime_hint: undefined,
				registry_type: "nuget",
				identifier: "Knapcode.SampleMcpServer",
			}),
		);
		expect(cmd).toEqual({
			type: "stdio",
			json: {
				type: "stdio",
				command: "dnx",
				args: ["Knapcode.SampleMcpServer@1.2.3"],
				env: undefined,
			},
		});
	});

	it("builds docker command with image:version", () => {
		const cmd = buildPackageConfigExample(
			basePkg({
				runtime_hint: undefined,
				registry_type: "oci",
				identifier: "org/image",
			}),
		);
		expect(cmd).toEqual({
			type: "stdio",
			json: {
				type: "stdio",
				command: "docker",
				args: ["run", "-i", "--rm", "org/image:1.2.3"],
				env: undefined,
			},
		});
	});

	it("renders environment variables and masks secrets", () => {
		const envs: KeyValueInput[] = [
			{ name: "API_KEY", is_secret: true, is_required: true },
			{ name: "LOG_LEVEL", default: "info", is_required: true },
		];
		const cmd = buildPackageConfigExample(
			basePkg({ environment_variables: envs }),
		);
		expect(cmd).toEqual({
			type: "stdio",
			json: {
				type: "stdio",
				command: "npx",
				args: ["-y", "example/pkg@1.2.3"],
				env: {
					API_KEY: "<secret>",
					LOG_LEVEL: "<value>",
				},
			},
		});
	});

	it("renders named args with '--' prefix and equals sign", () => {
		const args: Argument[] = [
			{ type: "named", name: "port", default: "8080", is_required: true },
			{ type: "named", name: "--flag", is_required: true },
		];
		const cmd = buildPackageConfigExample(basePkg({ package_arguments: args }));
		expect(cmd).toEqual({
			type: "stdio",
			json: {
				type: "stdio",
				command: "npx",
				args: ["-y", "example/pkg@1.2.3", "--port=<value>", "--flag=<value>"],
				env: undefined,
			},
		});
	});

	it("renders positional args with value or value_hint placeholder", () => {
		const args: Argument[] = [
			{ type: "positional", value: "run", is_required: true },
			{ type: "positional", value_hint: "target_dir", is_required: true },
		];
		const cmd = buildPackageConfigExample(basePkg({ package_arguments: args }));
		expect(cmd).toEqual({
			type: "stdio",
			json: {
				type: "stdio",
				command: "npx",
				args: ["-y", "example/pkg@1.2.3", "run", "<target_dir>"],
				env: undefined,
			},
		});
	});

	it("applies {curly_braces} variable substitution in values", () => {
		const args: Argument[] = [
			{
				type: "named",
				name: "mount",
				value: "{src}",
				variables: { src: { default: "/host" } },
				is_required: true,
			},
		];
		const cmd = buildPackageConfigExample(
			basePkg({
				runtime_hint: "docker",
				registry_type: "oci",
				identifier: "org/app",
				runtime_arguments: args,
			}),
		);
		expect(cmd).toEqual({
			type: "stdio",
			json: {
				type: "stdio",
				command: "docker",
				args: ["--mount={src}", "org/app:1.2.3"],
				env: undefined,
			},
		});
	});

	it("quotes tokens containing spaces", () => {
		const args: Argument[] = [
			{ type: "positional", value: "hello world", is_required: true },
		];
		const cmd = buildPackageConfigExample(basePkg({ package_arguments: args }));
		expect(cmd).toEqual({
			type: "stdio",
			json: {
				type: "stdio",
				command: "npx",
				args: ["-y", "example/pkg@1.2.3", '"hello world"'],
				env: undefined,
			},
		});
	});

	it("uses <filepath> placeholder for filepath format without defaults", () => {
		const args: Argument[] = [
			{ type: "positional", format: "filepath", is_required: true },
		];
		const cmd = buildPackageConfigExample(basePkg({ package_arguments: args }));
		expect(cmd).toEqual({
			type: "stdio",
			json: {
				type: "stdio",
				command: "npx",
				args: ["-y", "example/pkg@1.2.3", "<filepath>"],
				env: undefined,
			},
		});
	});

	it("keeps single-dash flags and formats value with equals sign", () => {
		const args: Argument[] = [
			{ type: "named", name: "-p", default: "8080", is_required: true },
		];
		const cmd = buildPackageConfigExample(basePkg({ package_arguments: args }));
		expect(cmd).toEqual({
			type: "stdio",
			json: {
				type: "stdio",
				command: "npx",
				args: ["-y", "example/pkg@1.2.3", "-p=<value>"],
				env: undefined,
			},
		});
	});

	it("uses first choice when default/value absent", () => {
		const args: Argument[] = [
			{
				type: "named",
				name: "mode",
				choices: ["local", "proxy"],
				is_required: true,
			},
		];
		const cmd = buildPackageConfigExample(basePkg({ package_arguments: args }));
		expect(cmd).toEqual({
			type: "stdio",
			json: {
				type: "stdio",
				command: "npx",
				args: ["-y", "example/pkg@1.2.3", "--mode=<value>"],
				env: undefined,
			},
		});
	});

	it("quotes whole token when named value contains spaces", () => {
		const args: Argument[] = [
			{
				type: "named",
				name: "arg",
				value: "/tmp/file name",
				is_required: true,
			},
		];
		const cmd = buildPackageConfigExample(basePkg({ package_arguments: args }));
		expect(cmd).toEqual({
			type: "stdio",
			json: {
				type: "stdio",
				command: "npx",
				args: ["-y", "example/pkg@1.2.3", '--arg="/tmp/file name"'],
				env: undefined,
			},
		});
	});

	it("orders docker runtime args before image and package args after image", () => {
		const rargs: Argument[] = [
			{
				type: "named",
				name: "mount",
				value: "{src}",
				variables: { src: { default: "/data" } },
				is_required: true,
			},
		];
		const pargs: Argument[] = [
			{ type: "positional", value: "run", is_required: true },
			{ type: "positional", value: "abc", is_required: true },
		];
		const cmd = buildPackageConfigExample(
			basePkg({
				runtime_hint: "docker",
				registry_type: "oci",
				identifier: "org/app",
				runtime_arguments: rargs,
				package_arguments: pargs,
			}),
		);
		expect(cmd).toEqual({
			type: "stdio",
			json: {
				type: "stdio",
				command: "docker",
				args: ["--mount={src}", "org/app:1.2.3", "run", "abc"],
				env: undefined,
			},
		});
	});

	it("does not duplicate repeated args; shows one instance only", () => {
		const rargs: Argument[] = [
			{
				type: "named",
				name: "mount",
				value: "{src}",
				is_repeated: true,
				variables: { src: { default: "/data" } },
				is_required: true,
			},
		];
		const cmd = buildPackageConfigExample(
			basePkg({
				runtime_hint: "docker",
				registry_type: "oci",
				identifier: "org/app",
				runtime_arguments: rargs,
			}),
		);
		expect(cmd).toEqual({
			type: "stdio",
			json: {
				type: "stdio",
				command: "docker",
				args: ["--mount={src}", "org/app:1.2.3"],
				env: undefined,
			},
		});
	});

	it("substitutes variables in env values and masks secrets", () => {
		const envs: KeyValueInput[] = [
			{
				name: "TOKEN",
				value: "{id}",
				variables: { id: { default: "42" } },
				is_required: true,
			},
			{ name: "SECRET", is_secret: true, value: "anything", is_required: true },
		];
		const cmd = buildPackageConfigExample(
			basePkg({ environment_variables: envs }),
		);
		expect(cmd).toEqual({
			type: "stdio",
			json: {
				type: "stdio",
				command: "npx",
				args: ["-y", "example/pkg@1.2.3"],
				env: {
					TOKEN: "{id}",
					SECRET: "<secret>",
				},
			},
		});
	});

	it("escapes quotes inside quoted tokens", () => {
		const args: Argument[] = [
			{ type: "positional", value: 'say "hello"', is_required: true },
		];
		const cmd = buildPackageConfigExample(basePkg({ package_arguments: args }));
		expect(cmd).toEqual({
			type: "stdio",
			json: {
				type: "stdio",
				command: "npx",
				args: ["-y", "example/pkg@1.2.3", '"say \\"hello\\""'],
				env: undefined,
			},
		});
	});

	it("omits non-required environment variables", () => {
		const envs: KeyValueInput[] = [
			{ name: "API_KEY", is_secret: true },
			{ name: "LOG_LEVEL", default: "info" },
		];
		const cmd = buildPackageConfigExample(
			basePkg({ environment_variables: envs }),
		);
		expect(cmd).toEqual({
			type: "stdio",
			json: {
				type: "stdio",
				command: "npx",
				args: ["-y", "example/pkg@1.2.3"],
				env: undefined,
			},
		});
	});

	it("omits non-required args", () => {
		const args: Argument[] = [
			{ type: "named", name: "port", default: "8080" },
			{ type: "positional", value: "run" },
		];
		const cmd = buildPackageConfigExample(basePkg({ package_arguments: args }));
		expect(cmd).toEqual({
			type: "stdio",
			json: {
				type: "stdio",
				command: "npx",
				args: ["-y", "example/pkg@1.2.3"],
				env: undefined,
			},
		});
	});
});

describe("buildRemoteConfigExample", () => {
	const baseRemote = (over: Partial<Remote> = {}): Remote => ({
		type: "streamable",
		transport_type: "streamable",
		url: "https://example.com/endpoint",
		...over,
	});

	it("returns SSE config with url and no headers", () => {
		const cfg = buildRemoteConfigExample(
			baseRemote({ transport_type: "sse", url: "https://ex.com/sse" }),
		);
		expect(cfg).toEqual({
			type: "sse",
			json: { type: "sse", url: "https://ex.com/sse" },
		});
	});

	it("renders headers using placeholders and masks secrets (SSE)", () => {
		const headers: KeyValueInput[] = [
			{ name: "X-Token", is_secret: true },
			{ name: "X-Default", default: "foo" },
			{ name: "X-Num", format: "number" },
			{ name: "X-Name", value: "Alice" },
		];
		const cfg = buildRemoteConfigExample(
			baseRemote({ transport_type: "sse", url: "https://ex.com/sse", headers }),
		);
		expect(cfg).toEqual({
			type: "sse",
			json: {
				type: "sse",
				url: "https://ex.com/sse",
				headers: {
					"X-Token": "<secret>",
					"X-Default": "<value>",
					"X-Num": "<number>",
					"X-Name": "Alice",
				},
			},
		});
	});

	it("maps streamable -> HTTP config with url and headers", () => {
		const headers: KeyValueInput[] = [
			{ name: "Accept", value: "text/event-stream" },
		];
		const cfg = buildRemoteConfigExample(
			baseRemote({
				transport_type: "streamable",
				url: "https://ex.com/http",
				headers,
			}),
		);
		expect(cfg).toEqual({
			type: "http",
			json: {
				type: "http",
				url: "https://ex.com/http",
				headers: { Accept: "text/event-stream" },
			},
		});
	});

	it("falls back to remote.type when transport_type is absent", () => {
		const r = { type: "sse", url: "https://ex.com/sse" } as unknown as Remote;
		const cfg = buildRemoteConfigExample(r);
		expect(cfg).toEqual({
			type: "sse",
			json: { type: "sse", url: "https://ex.com/sse" },
		});
	});

	it("returns null for unknown transport types", () => {
		const cfg = buildRemoteConfigExample(
			// biome-ignore lint/suspicious/noExplicitAny: ignore
			baseRemote({ transport_type: "stdio" as unknown as any }),
		);
		expect(cfg).toBeNull();
	});

	it("accepts 'streamable-http' and 'http' as HTTP aliases", () => {
		const http1 = buildRemoteConfigExample(
			baseRemote({
				// biome-ignore lint/suspicious/noExplicitAny: ignore
				transport_type: "streamable-http" as unknown as any,
				url: "https://ex.com/a",
			}),
		);
		expect(http1).toEqual({
			type: "http",
			json: { type: "http", url: "https://ex.com/a" },
		});

		const http2 = buildRemoteConfigExample(
			baseRemote({
				// biome-ignore lint/suspicious/noExplicitAny: ignore
				transport_type: "http" as unknown as any,
				url: "https://ex.com/b",
			}),
		);
		expect(http2).toEqual({
			type: "http",
			json: { type: "http", url: "https://ex.com/b" },
		});
	});
});
