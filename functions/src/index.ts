import { getApps, initializeApp } from "firebase-admin/app";
import { FieldPath, getFirestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { setGlobalOptions } from "firebase-functions/v2/options";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { getV0Servers, type ServerDetail } from "./api.generated";
import { bigram, numberToAlphabet } from "./util";

const apps = getApps();
if (apps.length === 0) {
	initializeApp();
}

const firestore = getFirestore();

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

export const fetchMcpServers = onSchedule(
	{
		schedule: "0,30 * * * *",
		timeoutSeconds: 600,
	},
	async () => {
		logger.info("Starting fetchMcpServers function");

		let cursor: string | undefined;
		do {
			logger.info(`Fetching servers with cursor: ${cursor}`);
			const response = await getV0Servers({ cursor, limit: 100 });
			if (response.status !== 200) {
				throw new Error(
					`Failed to fetch servers(${response.status}): ${JSON.stringify(response.data)}`,
				);
			}
			logger.info(`Fetched ${response.data.servers.length} servers`);

			const batch = firestore.batch();
			for (const server of response.data.servers) {
				// Delete old server if exists
				{
					const serverId =
						server._meta?.["io.modelcontextprotocol.registry/official"]?.id;
					if (serverId) {
						const docId = await getDocIdByServerId(serverId);
						if (docId) {
							batch.delete(firestore.collection("servers_v0").doc(docId));
						}
					}
				}

				// Skip non-latest or deleted servers
				if (
					!server._meta?.["io.modelcontextprotocol.registry/official"]
						?.is_latest ||
					(server.status as unknown) === "deleted"
				) {
					continue;
				}

				// Add new server
				const docId = buildServerDocId(server);
				const nameTokens = bigram(server.name).reduce(
					(acc, token) => {
						acc[token.toLowerCase()] = true;
						return acc;
					},
					{} as Record<string, boolean>,
				);

				server._meta = {
					...server._meta,
					"io.modelcontextprotocol.registry/publisher-provided": {
						nameTokens,
					},
				};

				batch.set(firestore.collection("servers_v0").doc(docId), server);
			}

			await batch.commit();
			logger.info("Committed batch");

			await new Promise((resolve) => setTimeout(resolve, 3000)); // Sleep for 3 second to avoid rate limit
			cursor = response.data.metadata?.next_cursor;
		} while (cursor);

		logger.info("Finished fetchMcpServers function");
	},
);

// NOTE: To enable full-text search using nameTokens, sorting is not possible.
//       Therefore, the ID is designed to be in reverse order of the update date so that the default sorting is by update date (newest first).
function buildServerDocId(server: ServerDetail): string {
	const updatedAt = (() => {
		const updatedAt =
			server.updated_at ??
			server._meta?.["io.modelcontextprotocol.registry/official"]?.updated_at;
		if (updatedAt) {
			return new Date(updatedAt);
		}
		return new Date();
	})();

	const futureDate = new Date("2999-12-31T23:59:59.999Z").getTime();
	const invertedTimestamp = futureDate - updatedAt.getTime();
	return (
		numberToAlphabet(invertedTimestamp, 8) +
		"_" +
		server._meta?.["io.modelcontextprotocol.registry/official"]?.id
	);
}

async function getDocIdByServerId(id: string): Promise<string | null> {
	const snapshot = await firestore
		.collection("servers_v0")
		.where(
			new FieldPath("_meta", "io.modelcontextprotocol.registry/official", "id"),
			"==",
			id,
		)
		.get();

	if (snapshot.empty) {
		return null;
	}

	return snapshot.docs[0].id;
}
