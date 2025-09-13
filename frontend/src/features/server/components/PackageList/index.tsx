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
import type { Package } from "../../lib/types";
import ConfigExample from "../ConfigExample";

function packageUrl(pkg: Package): string | undefined {
	if (!pkg.identifier) return undefined;
	if (!pkg.registry_type) return undefined;

	switch (pkg.registry_type) {
		case "npm":
			return `https://www.npmjs.com/package/${pkg.identifier}`;
		case "pypi":
			return `https://pypi.org/project/${pkg.identifier}`;
		case "nuget":
			return `https://www.nuget.org/packages/${pkg.identifier}`;
		// TODO: support more registries
	}

	return undefined;
}

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
								{/*Badges*/}
								<Group gap="xs" wrap="wrap">
									{pkg.registry_type && (
										<Badge variant="light" color="blue">
											{pkg.registry_type}
										</Badge>
									)}
									{pkg.version && <Badge variant="light">{pkg.version}</Badge>}
								</Group>

								{/*Identifier*/}
								{url ? (
									<Anchor
										className="inline-flex items-center gap-1 font-bold"
										href={url}
										target="_blank"
										rel="noreferrer"
									>
										{pkg.identifier}
										<IconExternalLink size={16} />
									</Anchor>
								) : (
									<Text className="font-bold">{pkg.identifier}</Text>
								)}

								<ConfigExample type="package" pkg={pkg} />
							</Stack>

							{/*Environment variables*/}
							{pkg.environment_variables &&
								pkg.environment_variables.length > 0 && (
									<Box>
										<Text c="dimmed">Environment variables</Text>
										<Stack gap={6}>
											{pkg.environment_variables.map((env) => (
												<Box key={env.name}>
													<Group gap={2}>
														<Code className="text-xs font-bold">
															{env.name}
														</Code>
														{env.is_required && (
															<Text className="font-bold" size="xs" c="red">
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
