import { ActionIcon, Code, CopyButton, Group } from "@mantine/core";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import type { Package } from "../../lib/api.generated";
import { buildConfigExample } from "./config";

type CommandExampleProps = {
	pkg: Package;
};

export default function ConfigExample({ pkg }: CommandExampleProps) {
	const config = buildConfigExample(pkg);
	if (!config) return null;

	return (
		<Group gap={6} wrap="nowrap" align="center">
			<Code
				className="whitespace-pre-wrap overflow-x-auto text-sm flex-1"
				p="xs"
			>
				{JSON.stringify(config, null, 2)}
			</Code>
			<CopyButton value={JSON.stringify(config, null, 2)} timeout={1000}>
				{({ copied, copy }) => (
					<ActionIcon size="xs" variant="transparent" onClick={copy}>
						{copied ? <IconCheck /> : <IconCopy />}
					</ActionIcon>
				)}
			</CopyButton>
		</Group>
	);
}
