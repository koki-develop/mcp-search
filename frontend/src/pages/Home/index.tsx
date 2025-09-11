import {
	Box,
	Button,
	Container,
	Loader,
	Stack,
	TextInput,
} from "@mantine/core";
import { useDebouncedState, useHotkeys } from "@mantine/hooks";
import { IconSearch } from "@tabler/icons-react";
import { useRef } from "react";
import { useServers } from "../../lib/servers";
import ServerCard from "./ServerCard";

export default function Home() {
	const searchInputRef = useRef<HTMLInputElement>(null);
	const [keyword, setKeyword] = useDebouncedState<string>("", 200);
	const { isFetching, data, hasNextPage, fetchNextPage } = useServers({
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

				<Stack gap="sm">
					{data?.map((server) => (
						<ServerCard key={server.id} server={server} />
					))}
				</Stack>

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
