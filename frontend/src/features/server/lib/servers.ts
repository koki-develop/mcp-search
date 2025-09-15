import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
	collection,
	FieldPath,
	getCountFromServer,
	getDocs,
	limit,
	type QueryConstraint,
	type QueryDocumentSnapshot,
	query,
	startAfter,
	where,
} from "firebase/firestore";
import { useEffect } from "react";
import { firestore } from "../../../lib/firebase";
import type { ServerDetail } from "./types";

export type Server = ServerDetail & { id: string };

type ListServersParams = {
	limit: number;
	keyword: string;
	cursor: QueryDocumentSnapshot | null;
};

function _buildNameTokensConstraints(params: ListServersParams) {
	const words = params.keyword.split(/\s+/).filter((word) => word.length > 0);
	return words.reduce<QueryConstraint[]>((acc, word) => {
		const tokens = _bigram(word);
		acc.push(
			...tokens.map((token) =>
				where(
					new FieldPath(
						"_meta",
						"io.modelcontextprotocol.registry/publisher-provided",
						"nameTokens",
						token.toLowerCase(),
					),
					"==",
					true,
				),
			),
		);
		return acc;
	}, []);
}

async function _countServers(params: ListServersParams): Promise<number> {
	const serversCollection = collection(firestore, "servers_v0");
	const ref = query(serversCollection, ..._buildNameTokensConstraints(params));
	const snapshot = await getCountFromServer(ref);
	return snapshot.data().count;
}

async function _listServers(
	params: ListServersParams,
): Promise<{ servers: Server[]; nextCursor: QueryDocumentSnapshot | null }> {
	const serversCollection = collection(firestore, "servers_v0");

	const ref = query(
		serversCollection,
		limit(params.limit),
		..._buildNameTokensConstraints(params),
		...(params.cursor ? [startAfter(params.cursor)] : []),
	);
	const snapshot = await getDocs(ref);

	const servers = snapshot.docs.map(
		(doc) => ({ id: doc.id, ...doc.data() }) as Server,
	);
	const nextCursor =
		snapshot.docs.length === params.limit
			? snapshot.docs[snapshot.docs.length - 1]
			: null;
	return { servers, nextCursor };
}

export type UseServersParams = {
	keyword: string;
};

export function useServers(params: UseServersParams) {
	const { error, ...query } = useInfiniteQuery({
		queryKey: ["servers", params],
		initialPageParam: null as QueryDocumentSnapshot | null,
		queryFn: ({ pageParam }) =>
			_listServers({
				keyword: params.keyword,
				cursor: pageParam,
				limit: 20,
			}),
		select: (data) => data.pages.flatMap((page) => page.servers),
		getNextPageParam: (lastPage) => lastPage.nextCursor,
	});

	useEffect(() => {
		if (error) {
			console.error(error);
		}
	}, [error]);

	return query;
}

export function useServersCount(params: UseServersParams) {
	const { error, ...query } = useQuery({
		queryKey: ["servers", params, "count"],
		queryFn: () =>
			_countServers({
				keyword: params.keyword,
				cursor: null,
				limit: 0,
			}),
	});

	useEffect(() => {
		if (error) {
			console.error(error);
		}
	}, [error]);

	return query;
}

async function getServerByName(name: string): Promise<Server | null> {
	const serversCollection = collection(firestore, "servers_v0");
	const ref = query(serversCollection, where("name", "==", name), limit(1));
	const snapshot = await getDocs(ref);
	if (snapshot.empty) {
		return null;
	}
	const doc = snapshot.docs[0];
	return { id: doc.id, ...doc.data() } as Server;
}

export type UseServerParams = {
	name?: string;
};

export function useServer(params: UseServerParams) {
	const { error, ...query } = useQuery({
		queryKey: ["server", params],
		queryFn: () => (params.name ? getServerByName(params.name) : null),
	});

	useEffect(() => {
		if (error) {
			console.error(error);
		}
	}, [error]);

	return query;
}

function _bigram(str: string): string[] {
	const bigrams: string[] = [];
	for (let i = 0; i < str.length - 1; i++) {
		bigrams.push(str.slice(i, i + 2));
	}
	return bigrams;
}
