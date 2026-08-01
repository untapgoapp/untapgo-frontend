import PlaygroupDetail from "@/components/playgroups/PlaygroupDetail";
import {
  normalizeDeepLinkedPostId,
  normalizePlaygroupSection,
} from "@/lib/playgroup-communications";

export default async function PlaygroupDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ playgroupId: string }>;
  searchParams: Promise<{ section?: string | string[]; post?: string | string[] }>;
}) {
  const { playgroupId } = await params;
  const query = await searchParams;
  return (
    <PlaygroupDetail
      playgroupId={playgroupId}
      section={normalizePlaygroupSection(query.section)}
      targetPostId={normalizeDeepLinkedPostId(query.post)}
    />
  );
}
