import { Card, Text } from "@mantine/core";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import type { Server } from "../../lib/servers";

dayjs.extend(relativeTime);

export type ServerCardProps = {
	server: Server;
	onSelect: (server: Server) => void;
};

export default function ServerCard({ server, onSelect }: ServerCardProps) {
	const meta = server._meta?.["io.modelcontextprotocol.registry/official"];
	const metaItems = (() => {
		const items = [server.version];
		if (meta) items.push(dayjs(meta.updated_at).fromNow());
		if (server.packages && server.packages.length > 0)
			items.push(
				`${server.packages.length} package${server.packages.length > 1 ? "s" : ""}`,
			);
		if (server.remotes && server.remotes.length > 0)
			items.push(
				`${server.remotes.length} remote${server.remotes.length > 1 ? "s" : ""}`,
			);
		return items;
	})();

	return (
		<Card
			component="button"
			className="cursor-pointer text-left focus-visible:outline-1 focus-visible:outline-[#228be6]"
			withBorder
			shadow="xs"
			onClick={() => onSelect(server)}
		>
			<Text className="break-all font-bold" size="xl">
				{server.name}
			</Text>
			<Text lineClamp={2} mb="xs">
				{server.description}
			</Text>

			{meta && (
				<Text c="dimmed" size="sm">
					{metaItems.join(" • ")}
				</Text>
			)}
		</Card>
	);
}
