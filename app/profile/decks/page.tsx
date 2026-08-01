import DecksDashboard from "@/components/decks/DecksDashboard";
import { normalizeDecksView } from "@/lib/deck-routes";

export default async function ProfileDecksPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string | string[] }>;
}) {
  const query = await searchParams;
  return <DecksDashboard view={normalizeDecksView(query.view)} />;
}
