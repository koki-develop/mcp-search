import "./index.css";

import {
	CodeHighlightAdapterProvider,
	createShikiAdapter,
} from "@mantine/code-highlight";
import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Routes } from "react-router";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
		},
	},
});

async function loadShiki() {
	const { createHighlighter } = await import("shiki");
	const shiki = await createHighlighter({
		langs: ["json", "shell"],
		themes: [],
	});

	return shiki;
}

const shikiAdapter = createShikiAdapter(loadShiki);

export default function App() {
	return (
		<MantineProvider>
			<CodeHighlightAdapterProvider adapter={shikiAdapter}>
				<QueryClientProvider client={queryClient}>
					<Layout>
						<Routes>
							<Route path="/" element={<Home />} />
							<Route path="*" element={<NotFound />} />
						</Routes>
					</Layout>
				</QueryClientProvider>
			</CodeHighlightAdapterProvider>
		</MantineProvider>
	);
}
