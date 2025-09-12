import { useInfiniteQuery } from "@tanstack/react-query";
import {
	collection,
	FieldPath,
	getDocs,
	limit,
	type QueryConstraint,
	type QueryDocumentSnapshot,
	query,
	startAfter,
	where,
} from "firebase/firestore";
import type { ServerDetail } from "./api.generated";
import { firestore } from "./firebase";

export type Server = ServerDetail & { id: string };

type ListServersParams = {
	limit: number;
	keyword: string;
	cursor: QueryDocumentSnapshot | null;
};

const _listServers = async (
	params: ListServersParams,
): Promise<{ servers: Server[]; nextCursor: QueryDocumentSnapshot | null }> => {
	const serversCollection = collection(firestore, "servers_v0");

	const words = params.keyword.split(/\s+/).filter((word) => word.length > 0);
	const nameTokensConstraints = words.reduce((acc, word) => {
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
	}, [] as QueryConstraint[]);

	const ref = query(
		serversCollection,
		limit(params.limit),
		...nameTokensConstraints,
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
};

export type UseServersParams = {
	keyword: string;
};

export const useServers = (params: UseServersParams) => {
	return useInfiniteQuery({
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
};

const _bigram = (str: string): string[] => {
	const bigrams: string[] = [];
	for (let i = 0; i < str.length - 1; i++) {
		bigrams.push(str.slice(i, i + 2));
	}
	return bigrams;
};
