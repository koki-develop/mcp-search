import type { Package } from "../../../../lib/api.generated";

export function packageUrl(pkg: Package): string | undefined {
	if (!pkg.identifier) return undefined;
	if (!pkg.registry_type) return undefined;

	switch (pkg.registry_type) {
		case "npm":
			return `https://www.npmjs.com/package/${pkg.identifier}`;
		case "pypi":
			return `https://pypi.org/project/${pkg.identifier}`;
		// TODO: support more registries
	}

	return undefined;
}
