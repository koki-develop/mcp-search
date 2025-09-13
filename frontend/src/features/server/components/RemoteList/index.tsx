import { Badge, Box, Card, Code, Group, Stack, Text } from "@mantine/core";
import type { Remote } from "../../lib/types";
import ConfigExample from "../ConfigExample";

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
								<Badge variant="light">
									{/* biome-ignore lint/suspicious/noExplicitAny: ignore */}
									{remote.transport_type ?? (remote as any).type}
								</Badge>
							</Group>

							{/*Config*/}
							<ConfigExample type="remote" remote={remote} />

							{/*Headers*/}
							{remote.headers && remote.headers.length > 0 && (
								<Box>
									<Text c="dimmed">Headers</Text>
									<Group gap={6}>
										{remote.headers.map((header) => (
											<Box key={header.name}>
												<Group gap={2}>
													<Code className="text-xs font-bold">
														{header.name}
													</Code>
													{header.is_required && (
														<Text className="font-bold" size="xs" c="red">
															*
														</Text>
													)}
												</Group>
												<Text size="sm" c="dark">
													{header.description}
												</Text>
											</Box>
										))}
									</Group>
								</Box>
							)}
						</Stack>
					</Card>
				);
			})}
		</Stack>
	);
}
