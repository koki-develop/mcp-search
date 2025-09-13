import { ActionIcon, Code, CopyButton, Group } from "@mantine/core";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import type { Package } from "../../lib/api.generated";
import { buildCommandExample } from "./command";

type CommandExampleProps = { pkg: Package };

export default function CommandExample({ pkg }: CommandExampleProps) {
	const command = buildCommandExample(pkg);
	if (!command) return null;

	return (
		<Group gap={6} wrap="nowrap" align="center">
			<Code className="whitespace-nowrap overflow-x-auto text-sm flex-1" p="xs">
				$ {command}
			</Code>
			<CopyButton value={command} timeout={1000}>
				{({ copied, copy }) => (
					<ActionIcon size="xs" variant="transparent" onClick={copy}>
						{copied ? <IconCheck /> : <IconCopy />}
					</ActionIcon>
				)}
			</CopyButton>
		</Group>
	);
}
