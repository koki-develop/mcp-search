import {
	Box,
	Button,
	Container,
	Loader,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import { useDebouncedState, useHotkeys } from "@mantine/hooks";
import { IconSearch } from "@tabler/icons-react";
import { useEffect, useRef } from "react";
import { useServers } from "../../lib/servers";
import ServerCard from "./ServerCard";

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

				{hasNextPage && (
					<Box ta="center">
						<Button onClick={() => fetchNextPage()} disabled={isFetching}>
							Load More
						</Button>
					</Box>
				)}
			</Stack>
		</Container>
	);
}
