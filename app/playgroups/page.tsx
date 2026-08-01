import PlaygroupsDirectory from "@/components/playgroups/PlaygroupsDirectory";
import { normalizePlaygroupsView } from "@/lib/playgroups";

export default async function PlaygroupsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string | string[] }>;
}) {
  const query = await searchParams;
  const view = normalizePlaygroupsView(query.view);

  return <PlaygroupsDirectory key={view} view={view} />;
}
