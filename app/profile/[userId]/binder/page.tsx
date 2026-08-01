import PublicBinder from "@/components/binder/PublicBinder";

export default async function PublicBinderPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return <PublicBinder ownerId={userId} />;
}
