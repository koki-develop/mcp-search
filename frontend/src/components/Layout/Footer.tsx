import { Anchor, Box, Container, Stack, Text } from "@mantine/core";
import { IconBrandGithub } from "@tabler/icons-react";

export default function Footer() {
	return (
		<Box component="footer" py="xl">
			<Container>
				<Stack gap="sm" align="center">
					<Text size="sm" c="dimmed" className="text-center">
						&copy; 2025 Koki Sato
					</Text>
					<Anchor
						href="https://github.com/koki-develop/mcp-search"
						target="_blank"
						rel="noopener noreferrer"
						c="dimmed"
						aria-label="Open GitHub repository"
					>
						<IconBrandGithub size={24} />
					</Anchor>
				</Stack>
			</Container>
		</Box>
	);
}
