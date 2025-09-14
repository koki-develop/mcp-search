import { Box, Card, Group, Stack, Text } from "@mantine/core";
import type { Remote } from "../../lib/types";
import ConfigExample from "../ConfigExample";
import KeyValue from "../KeyValue";
import { TransportBadge } from "../TransportBadge";

export type ServerRemoteListProps = {
	remotes: Remote[];
};

export default function ServerRemoteList({ remotes }: ServerRemoteListProps) {
	return (
		<Stack gap="xs">
			{remotes.map((remote) => {
				return (
					<Card key={`${remote.transport_type}_${remote.url}`} withBorder>
						<Stack gap={6}>
							{/* Badges */}
							<Group gap="xs" wrap="wrap">
								<TransportBadge
									transport={remote.transport_type ?? remote.type}
								/>
							</Group>

							{/*Config*/}
							<ConfigExample type="remote" remote={remote} />

							{/*Headers*/}
							{remote.headers && remote.headers.length > 0 && (
								<Box>
									<Text c="dimmed">Headers</Text>
									<KeyValue kvs={remote.headers} />
								</Box>
							)}
						</Stack>
					</Card>
				);
			})}
		</Stack>
	);
}
