import PlayersDashboard from "@/components/players/PlayersDashboard";
import { normalizePlayersView } from "@/lib/player-directory";

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string | string[] }>;
}) {
  const query = await searchParams;
  return <PlayersDashboard view={normalizePlayersView(query.view)} />;
}
