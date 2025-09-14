import { Box } from "@mantine/core";
import type { PropsWithChildren } from "react";
import Footer from "./Footer";

export default function Layout({ children }: PropsWithChildren) {
	return (
		<Box className="flex min-h-dvh flex-col">
			<Box component="main" className="grow">
				{children}
			</Box>
			<Footer />
		</Box>
	);
}
