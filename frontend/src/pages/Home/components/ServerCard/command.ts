import type {
	Argument,
	InputFormat,
	KeyValueInput,
	Package,
} from "../../../../lib/api.generated";

const RUNTIME_FALLBACK: Record<string, string> = {
	npm: "npx",
	pypi: "uvx",
	nuget: "dnx",
	oci: "docker",
};

export function buildCommandExample(pkg: Package): string | null {
	if (!pkg || !pkg.identifier || !pkg.version) return null;
	if (pkg.registry_type === "mcpb") return null;

	const runtime =
		pkg.runtime_hint ??
		(pkg.registry_type ? RUNTIME_FALLBACK[pkg.registry_type] : undefined);
	if (!runtime) return null;

	const envParts = renderEnv(
		pkg.environment_variables?.filter((env) => env.is_required) ?? [],
	);
	const runtimeArgs = renderArgs(
		pkg.runtime_arguments?.filter((arg) => arg.is_required) ?? [],
	);
	const pkgArgs = renderArgs(
		pkg.package_arguments?.filter((arg) => arg.is_required) ?? [],
	);

	let tokens: string[] = [];
	if (runtime === "npx") {
		tokens = [
			"npx",
			"-y",
			...runtimeArgs,
			`${pkg.identifier}@${pkg.version}`,
			...pkgArgs,
		];
	} else if (runtime === "uvx") {
		tokens = [
			"uvx",
			...runtimeArgs,
			`${pkg.identifier}==${pkg.version}`,
			...pkgArgs,
		];
	} else if (runtime === "dnx") {
		tokens = [
			"dnx",
			...runtimeArgs,
			`${pkg.identifier}@${pkg.version}`,
			...pkgArgs,
		];
	} else if (runtime === "docker") {
		const imageRef = resolveOciImageRef(pkg.identifier, pkg.version);
		tokens = [
			"docker",
			"run",
			"--rm",
			"-i",
			...runtimeArgs,
			imageRef,
			...pkgArgs,
		];
	} else {
		return null;
	}

	const command = [...envParts, ...tokens].map(quoteIfNeeded).join(" ");
	return command;
}

function resolveOciImageRef(identifier: string, version: string): string {
	if (identifier.includes("@sha256:")) return identifier;
	if (/:[^/]+$/.test(identifier)) return identifier;
	return `${identifier}:${version}`;
}

function renderEnv(envs: KeyValueInput[]): string[] {
	return envs.map((env) => {
		const raw = env.is_secret ? "<secret>" : stringifyValue(env);
		return `${env.name}=${raw ?? "<value>"}`;
	});
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
		return `"${s.replace(/"/g, '\\"')}"`;
	}
	return s;
}
