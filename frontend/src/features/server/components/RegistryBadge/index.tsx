import { Badge } from "@mantine/core";

export type RegistryBadgeProps = {
	registry: string;
};

const colorMap: Record<string, string> = {
	npm: "#CB3837",
	pypi: "#3775A9",
	nuget: "#004880",
	oci: "#2496ED",
};

export function RegistryBadge({ registry }: RegistryBadgeProps) {
	const color = colorMap[registry] || "blue";

	return (
		<Badge variant="filled" color={color}>
			{registry}
		</Badge>
	);
}
