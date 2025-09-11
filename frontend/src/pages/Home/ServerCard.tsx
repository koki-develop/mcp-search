import { Card, Text } from "@mantine/core";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import type { Server } from "../../lib/servers";

dayjs.extend(relativeTime);

export type ServerCardProps = {
	server: Server;
};

export default function ServerCard({ server }: ServerCardProps) {
	const meta = server._meta?.["io.modelcontextprotocol.registry/official"];
	return (
		<Card withBorder shadow="xs">
			<Text style={{ wordBreak: "break-all" }} size="lg" fw="bold">
				{server.name}
			</Text>
			<Text lineClamp={2} mb="xs">
				{server.description}
			</Text>

			{meta && (
				<Text c="dimmed" size="sm">
					{server.version} • Updated {dayjs(meta.updated_at).fromNow()}
				</Text>
			)}
		</Card>
	);
}
