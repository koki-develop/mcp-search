import {
	Anchor,
	Box,
	Button,
	Container,
	Loader,
	Stack,
	Text,
	TextInput,
	Title,
} from "@mantine/core";
import { useDebouncedState, useHotkeys } from "@mantine/hooks";
import { IconSearch } from "@tabler/icons-react";
import { useEffect, useRef } from "react";
import { useServers } from "../../lib/servers";
import ServerCard from "./components/ServerCard";

export default function Home() {
	const searchInputRef = useRef<HTMLInputElement>(null);
	const [keyword, setKeyword] = useDebouncedState<string>("", 200);
	const { isFetching, data, hasNextPage, fetchNextPage, error } = useServers({
		keyword,
	});
	const servers = data ?? [];

	useHotkeys([
		[
			"/",
			() => {
				searchInputRef.current?.focus();
			},
		],
	]);

	useEffect(() => {
		if (error) {
			console.error(error);
		}
	}, [error]);

	return (
		<Container py="lg">
			<Box mb="lg">
				<Title order={1} size="h2">
					MCP Search
				</Title>
				<Text>
					Quickly search and browse MCP servers registered with the{" "}
					<Anchor
						href="https://registry.modelcontextprotocol.io"
						target="_blank"
						rel="noopener noreferrer"
					>
						MCP Registry
					</Anchor>
					.
				</Text>
			</Box>

			<Stack gap="sm">
				<TextInput
					ref={searchInputRef}
					leftSection={<IconSearch />}
					size="lg"
					type="search"
					placeholder="Search Servers..."
					defaultValue={keyword}
					onChange={(e) => setKeyword(e.currentTarget.value)}
				/>

				{!isFetching && servers.length === 0 && (
					<Text ta="center">No servers found.</Text>
				)}

				{servers.length > 0 && (
					<Stack gap="sm">
						{servers.map((server) => (
							<ServerCard key={server.id} server={server} />
						))}
					</Stack>
				)}

				{isFetching && (
					<Box ta="center">
						<Loader />
					</Box>
				)}

				{!isFetching && hasNextPage && (
					<Box ta="center">
						<Button onClick={() => fetchNextPage()}>Load More</Button>
					</Box>
				)}
			</Stack>
		</Container>
	);
}
