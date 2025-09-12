import { Box } from "@mantine/core";
import type { PropsWithChildren } from "react";
import Footer from "./Footer";

export default function Layout({ children }: PropsWithChildren) {
	return (
		<Box className="min-h-dvh flex flex-col">
			<Box component="main" className="grow">
				{children}
			</Box>
			<Footer />
		</Box>
	);
}
