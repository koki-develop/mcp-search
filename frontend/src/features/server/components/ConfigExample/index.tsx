import { ActionIcon, Code, CopyButton, Group, Stack } from "@mantine/core";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import type { Package, Remote } from "../../lib/types";
import { buildPackageConfigExample, buildRemoteConfigExample } from "./config";

type CommandExampleProps =
	| {
			type: "package";
			pkg: Package;
	  }
	| {
			type: "remote";
			remote: Remote;
	  };

export default function ConfigExample(props: CommandExampleProps) {
	const config = (() => {
		if (props.type === "package") {
			return buildPackageConfigExample(props.pkg);
		}
		if (props.type === "remote") {
			return buildRemoteConfigExample(props.remote);
		}
	})();
	if (!config) return null;

	return (
		<Stack>
			{(config.type === "sse" || config.type === "http") && config.command && (
				<Group gap={6} wrap="nowrap" align="center">
					<Code
						className="whitespace-nowrap overflow-x-auto text-sm flex-1"
						p="xs"
					>
						$ {config.command}
					</Code>
					<CopyButton value={config.command} timeout={1000}>
						{({ copied, copy }) => (
							<ActionIcon size="xs" variant="transparent" onClick={copy}>
								{copied ? <IconCheck /> : <IconCopy />}
							</ActionIcon>
						)}
					</CopyButton>
				</Group>
			)}

			<Group gap={6} wrap="nowrap" align="center">
				<Code
					className="whitespace-pre-wrap overflow-x-auto text-sm flex-1"
					p="xs"
				>
					{JSON.stringify(config.json, null, 2)}
				</Code>
				<CopyButton value={JSON.stringify(config.json, null, 2)} timeout={1000}>
					{({ copied, copy }) => (
						<ActionIcon size="xs" variant="transparent" onClick={copy}>
							{copied ? <IconCheck /> : <IconCopy />}
						</ActionIcon>
					)}
				</CopyButton>
			</Group>
		</Stack>
	);
}
