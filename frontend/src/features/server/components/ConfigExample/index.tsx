import { CodeHighlight } from "@mantine/code-highlight";
import { Stack } from "@mantine/core";
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
		<Stack gap={6}>
			{(config.type === "sse" || config.type === "http") && config.command && (
				<CodeHighlight
					className="whitespace-nowrap overflow-x-auto text-sm flex-1"
					language="shell"
					code={config.command}
				/>
			)}

			<CodeHighlight
				className="whitespace-pre-wrap overflow-x-auto text-sm flex-1"
				language="json"
				code={JSON.stringify(config.json, null, 2)}
			/>
		</Stack>
	);
}
