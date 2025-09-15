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
import { useRef } from "react";
import { useSearchParams } from "react-router";
import ServerCard from "../../features/server/components/ServerCard";
import { ServerDetails } from "../../features/server/components/ServerDetails";
import { useServers, useServersCount } from "../../features/server/lib/servers";

export default function Home() {
	const searchInputRef = useRef<HTMLInputElement>(null);
	const [keyword, setKeyword] = useDebouncedState<string>("", 200);
	const [searchParams, setSearchParams] = useSearchParams();
	const detailedServerName = searchParams.get("d");

	const { isFetching, data, hasNextPage, fetchNextPage } = useServers({
		keyword,
	});
	const servers = data ?? [];
	const { data: serversCount } = useServersCount({
		keyword,
	});

	useHotkeys([
		[
			"/",
			() => {
				searchInputRef.current?.focus();
			},
		],
	]);

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

				<Text className="pl-1" c="dimmed" size="sm">
					{isFetching || serversCount === undefined
						? "Loading..."
						: serversCount === 0
							? "No servers found."
							: `${serversCount} server${serversCount !== 1 ? "s" : ""} found.`}
				</Text>

				{servers.length > 0 && (
					<Stack gap="sm">
						{servers.map((server) => (
							<ServerCard
								key={server.id}
								server={server}
								onSelect={(server) => setSearchParams({ d: server.name })}
							/>
						))}
					</Stack>
				)}

				<ServerDetails
					name={detailedServerName ?? undefined}
					onClose={() => setSearchParams({})}
				/>

				{isFetching && (
					<Box className="text-center">
						<Loader />
					</Box>
				)}

				{!isFetching && hasNextPage && (
					<Box className="text-center">
						<Button onClick={() => fetchNextPage()}>Load More</Button>
					</Box>
				)}
			</Stack>
		</Container>
	);
}
