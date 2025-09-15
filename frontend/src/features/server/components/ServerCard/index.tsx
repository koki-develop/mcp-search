import { Button, Text } from "@mantine/core";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Link } from "react-router";
import type { Server } from "../../lib/servers";

dayjs.extend(relativeTime);

export type ServerCardProps = {
	server: Server;
};

export default function ServerCard({ server }: ServerCardProps) {
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
		<Button
			component={Link}
			classNames={{
				root: "h-fit shadow-sm",
				inner: "items-start justify-start",
				label: "flex items-start flex-col",
			}}
			p="md"
			variant="default"
			to={`?d=${encodeURIComponent(server.name)}`}
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
		</Button>
	);
}
