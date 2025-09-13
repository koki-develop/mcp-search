import type {
	Argument,
	InputFormat,
	KeyValueInput,
	Package,
} from "../../lib/api.generated";

const RUNTIME_FALLBACK: Record<string, string> = {
	npm: "npx",
	pypi: "uvx",
	nuget: "dnx",
	oci: "docker",
};

export type Config = {
	command: string;
	args: string[];
	env?: Record<string, string>;
};

export function buildConfigExample(pkg: Package): Config | null {
	if (!pkg || !pkg.identifier || !pkg.version) return null;
	if (pkg.registry_type === "mcpb") return null;

	const command =
		pkg.runtime_hint ??
		(pkg.registry_type ? RUNTIME_FALLBACK[pkg.registry_type] : undefined);
	if (!command) return null;

	return {
		command,
		args: [
			...renderArgs(
				pkg.runtime_arguments?.filter((arg) => arg.is_required) ?? [],
			),
			packageIdentifier(pkg),
			...renderArgs(
				pkg.package_arguments?.filter((arg) => arg.is_required) ?? [],
			),
		].map(quoteIfNeeded),
		env: renderEnv(
			pkg.environment_variables?.filter((env) => env.is_required) ?? [],
		),
	};
}

function packageIdentifier(pkg: Package): string {
	if (!pkg.identifier) return "";
	if (!pkg.version) return pkg.identifier;

	switch (pkg.registry_type) {
		case "npm":
			return `${pkg.identifier}@${pkg.version}`;
		case "pypi":
			return `${pkg.identifier}==${pkg.version}`;
		case "nuget":
			return `${pkg.identifier}@${pkg.version}`;
		case "oci":
			return `${pkg.identifier}:${pkg.version}`;
		default:
			return pkg.identifier;
	}
}

function renderEnv(envs: KeyValueInput[]): Record<string, string> | undefined {
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
