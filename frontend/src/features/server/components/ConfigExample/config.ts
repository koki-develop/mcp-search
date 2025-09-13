import type {
	Argument,
	InputFormat,
	KeyValueInput,
	Package,
} from "../../lib/types";

const RUNTIME_FALLBACK: Record<string, string> = {
	npm: "npx",
	pypi: "uvx",
	nuget: "dnx",
	oci: "docker",
};

export type StdioConfig = {
	type: "stdio";
	json: {
		type: "stdio";
		command: string;
		args: string[];
		env?: Record<string, string>;
	};
};

export type SseConfig = {
	type: "sse";
	command: string;
	json: {
		type: "sse";
		url: string;
		headers?: Record<string, string>;
	};
};

export type HttpConfig = {
	type: "http";
	command: string;
	json: {
		type: "http";
		url: string;
		headers?: Record<string, string>;
	};
};

export type Config = StdioConfig | SseConfig | HttpConfig;

export function buildConfigExample(pkg: Package): Config | null {
	if (!pkg || !pkg.identifier || !pkg.version) return null;
	if (pkg.registry_type === "mcpb") return null;

	const command =
		pkg.runtime_hint ??
		(pkg.registry_type ? RUNTIME_FALLBACK[pkg.registry_type] : undefined);
	if (!command) return null;

	const args = [
		...renderArgs(
			pkg.runtime_arguments?.filter((arg) => arg.is_required) ?? [],
		),
		packageIdentifier(pkg),
		...renderArgs(
			pkg.package_arguments?.filter((arg) => arg.is_required) ?? [],
		),
	].map(quoteIfNeeded);

	const env = renderKeyValue(
		pkg.environment_variables?.filter((env) => env.is_required) ?? [],
	);

	switch (pkg.transport.type) {
		case "stdio":
			return {
				type: "stdio",
				json: { type: "stdio", command, args, env },
			};
		case "sse":
			return {
				type: "sse",
				command: [
					...(env ? Object.entries(env).map(([k, v]) => `${k}=${v}`) : []),
					command,
					...args,
				]
					.map(quoteIfNeeded)
					.join(" "),
				json: {
					type: "sse",
					url: pkg.transport.url,
					headers: renderKeyValue(pkg.transport.headers ?? []),
				},
			};
		case "streamable-http":
			return {
				type: "http",
				command: [
					...(env ? Object.entries(env).map(([k, v]) => `${k}=${v}`) : []),
					command,
					...args,
				]
					.map(quoteIfNeeded)
					.join(" "),
				json: {
					type: "http",
					url: pkg.transport.url,
					headers: renderKeyValue(pkg.transport.headers ?? []),
				},
			};
	}
}

function packageIdentifier(pkg: Package): string {
	if (!pkg.identifier) return "";
	if (!pkg.version) return pkg.identifier;

	switch (pkg.registry_type) {
		case "npm":
		case "pypi":
		case "nuget":
			return `${pkg.identifier}@${pkg.version}`;
		case "oci":
			return `${pkg.identifier}:${pkg.version}`;
		default:
			return pkg.identifier;
	}
}

function renderKeyValue(
	envs: KeyValueInput[],
): Record<string, string> | undefined {
	if (envs.length === 0) return undefined;

	return envs.reduce(
		(acc, env) => {
			acc[env.name] = env.is_secret
				? "<secret>"
				: (stringifyValue(env) ?? "<value>");
			return acc;
		},
		{} as Record<string, string>,
	);
}

function renderArgs(args: Argument[]): string[] {
	const parts: string[] = [];
	for (const arg of args) {
		if (arg.type === "named") {
			const flag = normalizeFlagName(arg.name);
			if (arg.format === "boolean") {
				parts.push(flag);
			} else {
				const val = stringifyValue(arg);
				parts.push(`${flag}=${val}`);
			}
			continue;
		}

		parts.push(stringifyValue(arg));
	}
	return parts;
}

function normalizeFlagName(name: string): string {
	if (name.startsWith("-")) {
		return name;
	}
	if (name.length === 1) {
		return `-${name}`;
	}
	return `--${name}`;
}

type MinimalInput = {
	format?: InputFormat;
};

function stringifyValue(input: MinimalInput): string {
	switch (input.format) {
		case "string":
			return "<string>";
		case "number":
			return "<number>";
		case "boolean":
			return "<true|false>";
		case "filepath":
			return "<filepath>";
		default:
			return "<value>";
	}
}

function quoteIfNeeded(s: string): string {
	if (s === "") return '""';
	if (/[\s"'\\]/.test(s)) {
		return JSON.stringify(s);
	}
	return s;
}
