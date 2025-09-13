import {
	ActionIcon,
	Badge,
	Box,
	Card,
	Code,
	CopyButton,
	Group,
	Stack,
	Text,
} from "@mantine/core";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import type { Remote } from "../../lib/types";

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

							{/*URL*/}
							<Group gap={6} wrap="wrap">
								<Text size="sm" c="dimmed">
									URL:
								</Text>
								<Code className="whitespace-nowrap text-sm">{remote.url}</Code>
								<CopyButton value={remote.url} timeout={1000}>
									{({ copied, copy }) => (
										<ActionIcon size="xs" variant="transparent" onClick={copy}>
											{copied ? <IconCheck /> : <IconCopy />}
										</ActionIcon>
									)}
								</CopyButton>
							</Group>

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
