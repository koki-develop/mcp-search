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
					className="flex-1 overflow-x-auto whitespace-nowrap text-sm"
					language="shell"
					code={config.command}
				/>
			)}

			<CodeHighlight
				className="flex-1 overflow-x-auto whitespace-pre-wrap text-sm"
				language="json"
				code={JSON.stringify(config.json, null, 2)}
			/>
		</Stack>
	);
}
