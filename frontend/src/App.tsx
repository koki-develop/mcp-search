import "./index.css";

import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Routes } from "react-router";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

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
				<Layout>
					<Routes>
						<Route path="/" element={<Home />} />
						<Route path="*" element={<NotFound />} />
					</Routes>
				</Layout>
			</QueryClientProvider>
		</MantineProvider>
	);
}
