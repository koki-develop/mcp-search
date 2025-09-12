import { Box, Button, Container, Stack, Text, Title } from "@mantine/core";
import { Link } from "react-router";

export default function NotFound() {
	return (
		<Container py="lg">
			<Stack gap="md" align="center">
				<Title order={1} size="h2">
					404 - Page Not Found
				</Title>
				<Text>The page you're looking for doesn't exist.</Text>
				<Box>
					<Button component={Link} to="/">
						Back to Home
					</Button>
				</Box>
			</Stack>
		</Container>
	);
}
