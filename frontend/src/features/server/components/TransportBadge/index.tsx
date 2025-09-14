import { Badge } from "@mantine/core";

export type TransportBadgeProps = {
	transport: string;
};

const colorMap: Record<string, string> = {
	http: "green",
	sse: "blue",
	streamable: "teal",
	"streamable-http": "cyan",
	stdio: "orange",
};

export function TransportBadge({ transport }: TransportBadgeProps) {
	const color = colorMap[transport] || "blue";

	return (
		<Badge variant="filled" color={color}>
			{transport}
		</Badge>
	);
}
