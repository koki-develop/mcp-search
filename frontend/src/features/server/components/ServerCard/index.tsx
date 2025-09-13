import {
	Anchor,
	Badge,
	Card,
	Divider,
	Drawer,
	Group,
	Stack,
	Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import type { Server } from "../../lib/servers";
import type { Package, Remote } from "../../lib/types";
import PackageList from "../PackageList";
import RemoteList from "../RemoteList";

dayjs.extend(relativeTime);

export type ServerCardProps = {
	server: Server;
};

export default function ServerCard({ server }: ServerCardProps) {
	const [opened, { open, close }] = useDisclosure(false);
	const meta = server._meta?.["io.modelcontextprotocol.registry/official"];
	const metaItems = (() => {
		const items = [server.version];
		if (meta) items.push(dayjs(meta.updated_at).fromNow());
		if (server.packages && server.packages.length > 0)
			items.push(`${server.packages.length} packages`);
		if (server.remotes && server.remotes.length > 0)
			items.push(`${server.remotes.length} remotes`);
		return items;
	})();

	return (
		<>
			<Card
				component="button"
				className="cursor-pointer text-left"
				withBorder
				shadow="xs"
				onClick={open}
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

			<Drawer
				classNames={{
					header: "items-start",
				}}
				opened={opened}
				onClose={close}
				position="right"
				size="lg"
				title={
					<Stack gap={4}>
						{(meta?.updated_at || meta?.published_at) && (
							<Text size="xs" c="dimmed">
								{meta?.updated_at && (
									<>Updated {dayjs(meta.updated_at).fromNow()}</>
								)}
								{meta?.updated_at && meta?.published_at && " • "}
								{meta?.published_at && (
									<>Published {dayjs(meta.published_at).fromNow()}</>
								)}
							</Text>
						)}
						<Text size="xl" className="break-all font-bold">
							{server.name}
						</Text>
						<Group gap="xs" wrap="wrap">
							<Badge variant="light">{server.version}</Badge>
							{server.status && (
								<Badge
									color={server.status === "deprecated" ? "red" : "green"}
									variant="light"
								>
									{server.status}
								</Badge>
							)}
						</Group>
					</Stack>
				}
			>
				<Stack gap="md">
					<Stack gap={6}>
						<Text>{server.description}</Text>

						{server.repository?.url && (
							<Group gap={6} wrap="wrap">
								<Text size="sm" c="dimmed">
									Repository:
								</Text>
								<Anchor
									href={server.repository.url}
									target="_blank"
									rel="noreferrer"
								>
									{server.repository.url}
								</Anchor>
							</Group>
						)}
					</Stack>

					{server.packages && server.packages.length > 0 && (
						<>
							<Divider label="Packages" />
							<PackageList packages={server.packages as Package[]} />
						</>
					)}

					{server.remotes && server.remotes.length > 0 && (
						<>
							<Divider label="Remotes" />
							<RemoteList remotes={server.remotes as Remote[]} />
						</>
					)}
				</Stack>
			</Drawer>
		</>
	);
}
