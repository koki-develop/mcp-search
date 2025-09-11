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
import type { Server } from "../../../../lib/servers";
import ServerPackageList from "./PackageList";
import ServerRemoteList from "./RemoteList";

dayjs.extend(relativeTime);

export type ServerCardProps = {
	server: Server;
};

export default function ServerCard({ server }: ServerCardProps) {
	const [opened, { open, close }] = useDisclosure(false);
	const meta = server._meta?.["io.modelcontextprotocol.registry/official"];

	return (
		<>
			<Card withBorder shadow="xs" onClick={open}>
				<Text style={{ wordBreak: "break-all" }} size="xl" fw="bold">
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

			<Drawer
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
						<Text size="xl" fw="bold" style={{ wordBreak: "break-all" }}>
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
					<Stack gap="md">
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
							<ServerPackageList packages={server.packages} />
						</>
					)}

					{server.remotes && server.remotes.length > 0 && (
						<>
							<Divider label="Remotes" />
							<ServerRemoteList remotes={server.remotes} />
						</>
					)}
				</Stack>
			</Drawer>
		</>
	);
}
