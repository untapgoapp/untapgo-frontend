import ProfileNetworkList from "@/components/profile/social/ProfileNetworkList";
import { normalizeProfileNetworkTab } from "@/lib/profile-network";

export default async function ProfileNetworkPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{
    tab?: string | string[];
  }>;
}) {
  const [{ userId }, query] = await Promise.all([
    params,
    searchParams,
  ]);
  const tab = normalizeProfileNetworkTab(query.tab);

  return (
    <ProfileNetworkList
      key={`${userId}:${tab}`}
      profileId={userId}
      tab={tab}
    />
  );
}
