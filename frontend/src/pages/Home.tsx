import { useServers } from "../lib/servers";

export default function Home() {
  const { isFetching, data } = useServers();

  if (isFetching) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {data?.map((server) => (
        <div key={server.id}>{server.name}</div>
      ))}
    </div>
  );
}
