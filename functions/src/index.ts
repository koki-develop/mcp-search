import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { setGlobalOptions } from "firebase-functions/v2/options";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { getV0Servers } from "./api.generated";
import { bigram } from "./util";

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

export const fetchMcpServers = onSchedule("0,30 * * * *", async () => {
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
		let writeCount = 0;
		for (const server of response.data.servers) {
			const id =
				server._meta?.["io.modelcontextprotocol.registry/official"]?.id;
			if (!id) {
				logger.warn(`Server does not have id: ${JSON.stringify(server)}`);
				continue;
			}

			if ((server.status as unknown) === "deleted") {
				batch.delete(firestore.collection("servers_v0").doc(id));
			} else {
				const nameTokens = bigram(server.name).reduce(
					(acc, token) => {
						acc[token.toLowerCase()] = true;
						return acc;
					},
					{} as Record<string, boolean>,
				);
				const packageRegistryTypes =
					server.packages?.map((pkg) => pkg.registry_type).filter(Boolean) ??
					[];
				const remoteTransportTypes = server.remotes
					// biome-ignore lint/suspicious/noExplicitAny: ignore
					?.map((remote) => remote.transport_type ?? (remote as any).type)
					.filter(Boolean);

				server._meta = {
					...server._meta,
					"io.modelcontextprotocol.registry/publisher-provided": {
						nameTokens,
						packageRegistryTypes,
						remoteTransportTypes,
					},
				};

				batch.set(firestore.collection("servers_v0").doc(id), server);
			}
			writeCount++;
		}

		if (writeCount > 0) {
			await batch.commit();
			logger.info(`Wrote ${writeCount} servers to Firestore.`);
		} else {
			logger.info("No servers to write, exiting loop.");
		}

		await new Promise((resolve) => setTimeout(resolve, 1000)); // Sleep for 3 second to avoid rate limit
		cursor = response.data.metadata?.next_cursor;
	} while (cursor);

	logger.info("Finished fetchMcpServers function");
});
