import { useQuery } from "@tanstack/react-query";
import { collection, getDocs } from "firebase/firestore";
import type { ServerDetail } from "./api.generated";
import { firestore } from "./firebase";

export type Server = ServerDetail & { id: string };

const _listServers = async (): Promise<Server[]> => {
	const serversCollection = collection(firestore, "servers_v0");
	const snapshot = await getDocs(serversCollection);
	return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Server);
};

export const useServers = () => {
	// TODO: infinite query for pagination
	return useQuery({
		queryKey: ["servers"],
		queryFn: _listServers,
	});
};
