import {
	Anchor,
	Badge,
	Divider,
	Drawer,
	Group,
	Loader,
	Stack,
	Text,
} from "@mantine/core";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useServer } from "../../lib/servers";
import type { Package, Remote } from "../../lib/types";
import PackageList from "../PackageList";
import RemoteList from "../RemoteList";

export type ServerDetailsProps = {
	name?: string;
	onClose: () => void;
};

export function ServerDetails({ name, onClose }: ServerDetailsProps) {
	const [serverName, setServerName] = useState<string | undefined>(name);
	const { data: server, isLoading } = useServer({ name: serverName });
	const meta = server?._meta?.["io.modelcontextprotocol.registry/official"];

	useEffect(() => {
		if (name) {
			setServerName(name);
		}
	}, [name]);

	return (
		<Drawer
			classNames={{
				header: "items-start",
			}}
			opened={Boolean(name)}
			onClose={onClose}
			position="right"
			size="lg"
			title={
				server && (
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
				)
			}
		>
			{isLoading && <Loader />}
			{!isLoading && !server && <Text>Server not found.</Text>}
			{!isLoading && server && (
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
			)}
		</Drawer>
	);
}
