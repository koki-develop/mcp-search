import { describe, expect, it } from "bun:test";
import type {
	Argument,
	KeyValueInput,
	Package,
} from "../../../../lib/api.generated";
import { buildCommandExample } from "./command";

const basePkg = (over: Partial<Package> = {}): Package => ({
	identifier: "example/pkg",
	version: "1.2.3",
	registry_type: "npm",
	runtime_hint: "npx",
	...over,
});

describe("buildCommandExample", () => {
	it("returns null for missing identifier/version or mcpb", () => {
		expect(buildCommandExample(basePkg({ identifier: undefined }))).toBeNull();
		expect(buildCommandExample(basePkg({ version: undefined }))).toBeNull();
		expect(buildCommandExample(basePkg({ registry_type: "mcpb" }))).toBeNull();
	});

	it("builds npx command with -y and package@version", () => {
		const cmd = buildCommandExample(basePkg());
		expect(cmd).toEqual("npx -y example/pkg@1.2.3");
	});

	it("infers runtime from registry_type when runtime_hint is missing (pypi -> uvx)", () => {
		const cmd = buildCommandExample(
			basePkg({
				runtime_hint: undefined,
				registry_type: "pypi",
				identifier: "weather",
				version: "0.5.0",
			}),
		);
		expect(cmd).toEqual("uvx weather==0.5.0");
	});

	it("builds dnx command for nuget", () => {
		const cmd = buildCommandExample(
			basePkg({
				runtime_hint: undefined,
				registry_type: "nuget",
				identifier: "Knapcode.SampleMcpServer",
			}),
		);
		expect(cmd).toEqual("dnx Knapcode.SampleMcpServer@1.2.3");
	});

	it("builds docker run with --rm -i and image:version", () => {
		const cmd = buildCommandExample(
			basePkg({
				runtime_hint: undefined,
				registry_type: "oci",
				identifier: "org/image",
			}),
		);
		expect(cmd).toEqual("docker run --rm -i org/image:1.2.3");
	});

	it("keeps OCI digest as-is", () => {
		const cmd = buildCommandExample(
			basePkg({
				runtime_hint: "docker",
				registry_type: "oci",
				identifier: "org/image@sha256:abc",
				version: "9.9.9",
			}),
		);
		expect(cmd).toEqual("docker run --rm -i org/image@sha256:abc");
	});

	it("renders environment variables and masks secrets", () => {
		const envs: KeyValueInput[] = [
			{ name: "API_KEY", is_secret: true, is_required: true },
			{ name: "LOG_LEVEL", default: "info", is_required: true },
		];
		const cmd = buildCommandExample(basePkg({ environment_variables: envs }));
		expect(cmd).toEqual(
			"API_KEY=<secret> LOG_LEVEL=<value> npx -y example/pkg@1.2.3",
		);
	});

	it("renders named args with '--' prefix and equals sign", () => {
		const args: Argument[] = [
			{ type: "named", name: "port", default: "8080", is_required: true },
			{ type: "named", name: "--flag", is_required: true },
		];
		const cmd = buildCommandExample(basePkg({ package_arguments: args }));
		expect(cmd).toEqual(
			"npx -y example/pkg@1.2.3 --port=<value> --flag=<value>",
		);
	});

	it("renders positional args with value or value_hint placeholder", () => {
		const args: Argument[] = [
			{ type: "positional", value: "run", is_required: true },
			{ type: "positional", value_hint: "target_dir", is_required: true },
		];
		const cmd = buildCommandExample(basePkg({ package_arguments: args }));
		expect(cmd).toEqual("npx -y example/pkg@1.2.3 <value> <value>");
	});

	it("applies {curly_braces} variable substitution in values", () => {
		const args: Argument[] = [
			{
				type: "named",
				name: "mount",
				value: "src={src}",
				variables: { src: { default: "/host" } },
				is_required: true,
			},
		];
		const cmd = buildCommandExample(
			basePkg({
				runtime_hint: "docker",
				registry_type: "oci",
				identifier: "org/app",
				runtime_arguments: args,
			}),
		);
		expect(cmd).toEqual("docker run --rm -i --mount=<value> org/app:1.2.3");
	});

	it("quotes tokens containing spaces", () => {
		const args: Argument[] = [
			{ type: "positional", value: "hello world", is_required: true },
		];
		const cmd = buildCommandExample(basePkg({ package_arguments: args }));
		expect(cmd).toEqual("npx -y example/pkg@1.2.3 <value>");
	});

	it("uses <filepath> placeholder for filepath format without defaults", () => {
		const args: Argument[] = [
			{ type: "positional", format: "filepath", is_required: true },
		];
		const cmd = buildCommandExample(basePkg({ package_arguments: args }));
		expect(cmd).toEqual("npx -y example/pkg@1.2.3 <filepath>");
	});

	it("keeps single-dash flags and formats value with equals sign", () => {
		const args: Argument[] = [
			{ type: "named", name: "-p", default: "8080", is_required: true },
		];
		const cmd = buildCommandExample(basePkg({ package_arguments: args }));
		expect(cmd).toEqual("npx -y example/pkg@1.2.3 -p=<value>");
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
		const cmd = buildCommandExample(basePkg({ package_arguments: args }));
		expect(cmd).toEqual("npx -y example/pkg@1.2.3 --mode=<value>");
	});

	it("quotes whole token when named value contains spaces", () => {
		const args: Argument[] = [
			{
				type: "named",
				name: "arg",
				value: "path=/tmp/file name",
				is_required: true,
			},
		];
		const cmd = buildCommandExample(basePkg({ package_arguments: args }));
		expect(cmd).toEqual("npx -y example/pkg@1.2.3 --arg=<value>");
	});

	it("orders docker runtime args before image and package args after image", () => {
		const rargs: Argument[] = [
			{
				type: "named",
				name: "mount",
				value: "src={src}",
				variables: { src: { default: "/data" } },
				is_required: true,
			},
		];
		const pargs: Argument[] = [
			{ type: "positional", value: "run", is_required: true },
			{ type: "positional", value: "abc", is_required: true },
		];
		const cmd = buildCommandExample(
			basePkg({
				runtime_hint: "docker",
				registry_type: "oci",
				identifier: "org/app",
				runtime_arguments: rargs,
				package_arguments: pargs,
			}),
		);
		expect(cmd).toEqual(
			"docker run --rm -i --mount=<value> org/app:1.2.3 <value> <value>",
		);
	});

	it("does not duplicate repeated args; shows one instance only", () => {
		const rargs: Argument[] = [
			{
				type: "named",
				name: "mount",
				value: "src={src}",
				is_repeated: true,
				variables: { src: { default: "/data" } },
				is_required: true,
			},
		];
		const cmd = buildCommandExample(
			basePkg({
				runtime_hint: "docker",
				registry_type: "oci",
				identifier: "org/app",
				runtime_arguments: rargs,
			}),
		);
		expect(cmd).toEqual("docker run --rm -i --mount=<value> org/app:1.2.3");
	});

	it("substitutes variables in env values and masks secrets", () => {
		const envs: KeyValueInput[] = [
			{
				name: "TOKEN",
				value: "id={id}",
				variables: { id: { default: "42" } },
				is_required: true,
			},
			{ name: "SECRET", is_secret: true, value: "anything", is_required: true },
		];
		const cmd = buildCommandExample(basePkg({ environment_variables: envs }));
		expect(cmd).toEqual(
			"TOKEN=<value> SECRET=<secret> npx -y example/pkg@1.2.3",
		);
	});

	it("escapes quotes inside quoted tokens", () => {
		const args: Argument[] = [
			{ type: "positional", value: 'say "hello"', is_required: true },
		];
		const cmd = buildCommandExample(basePkg({ package_arguments: args }));
		expect(cmd).toEqual("npx -y example/pkg@1.2.3 <value>");
	});

	it("omits non-required environment variables", () => {
		const envs: KeyValueInput[] = [
			{ name: "API_KEY", is_secret: true },
			{ name: "LOG_LEVEL", default: "info" },
		];
		const cmd = buildCommandExample(basePkg({ environment_variables: envs }));
		expect(cmd).toEqual("npx -y example/pkg@1.2.3");
	});

	it("omits non-required args", () => {
		const args: Argument[] = [
			{ type: "named", name: "port", default: "8080" },
			{ type: "positional", value: "run" },
		];
		const cmd = buildCommandExample(basePkg({ package_arguments: args }));
		expect(cmd).toEqual("npx -y example/pkg@1.2.3");
	});
});
