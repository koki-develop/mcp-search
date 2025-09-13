import { Box, Code, Group, Stack, Text } from "@mantine/core";
import type { KeyValueInput } from "../../lib/types";

export type KeyValueProps = {
	kvs: KeyValueInput[];
};

export default function KeyValue({ kvs }: KeyValueProps) {
	return (
		<Stack gap={6}>
			{kvs.map((item) => (
				<Box key={item.name}>
					<Group gap={2}>
						<Code className="text-xs font-bold">{item.name}</Code>
						{item.is_required && (
							<Text className="font-bold" size="xs" c="red">
								*
							</Text>
						)}
					</Group>
					<Text size="sm" c="dark">
						{item.description ?? "No description provided."}
					</Text>
				</Box>
			))}
		</Stack>
	);
}
