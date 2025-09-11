import {
	Anchor,
	Badge,
	Box,
	Card,
	Code,
	Group,
	Stack,
	Text,
} from "@mantine/core";
import { IconExternalLink } from "@tabler/icons-react";
import type { Package } from "../../../../lib/api.generated";
import { packageUrl } from "./serverUtils";

type ServerPackageListProps = {
	packages: Package[];
};

export default function ServerPackageList({
	packages,
}: ServerPackageListProps) {
	return (
		<Stack gap="xs">
			{packages.map((pkg) => {
				const url = packageUrl(pkg);

				return (
					<Card key={pkg.identifier} withBorder padding="sm" radius="md">
						<Stack gap="sm">
							<Stack gap={4}>
								<Group gap="xs" wrap="wrap">
									{pkg.registry_type && (
										<Badge variant="light" color="blue">
											{pkg.registry_type}
										</Badge>
									)}
									{pkg.version && <Badge variant="light">{pkg.version}</Badge>}
								</Group>

								{url ? (
									<Anchor
										styles={{
											root: {
												display: "inline-flex",
												alignItems: "center",
												gap: 4,
											},
										}}
										fw="bold"
										href={url}
										target="_blank"
										rel="noreferrer"
									>
										{pkg.identifier}
										<IconExternalLink size={16} />
									</Anchor>
								) : (
									<Text fw="bold">{pkg.identifier}</Text>
								)}
							</Stack>

							{pkg.environment_variables &&
								pkg.environment_variables.length > 0 && (
									<Box>
										<Text c="dimmed">Environment variables</Text>
										<Stack gap={6}>
											{pkg.environment_variables.map((env) => (
												<Box key={env.name}>
													<Group gap={2}>
														<Code fz="xs" fw="bold">
															{env.name}
														</Code>
														{env.is_required && (
															<Text fw="bold" size="xs" c="red">
																*
															</Text>
														)}
													</Group>
													<Text size="sm" c="dark">
														{env.description}
													</Text>
												</Box>
											))}
										</Stack>
									</Box>
								)}
						</Stack>
					</Card>
				);
			})}
		</Stack>
	);
}
