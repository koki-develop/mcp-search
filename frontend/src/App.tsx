import "@mantine/core/styles.css";

import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Home from "./pages/Home";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			gcTime: 0,
			refetchOnWindowFocus: false,
		},
	},
});

export default function App() {
	return (
		<MantineProvider>
			<QueryClientProvider client={queryClient}>
				<Home />
			</QueryClientProvider>
		</MantineProvider>
	);
}
