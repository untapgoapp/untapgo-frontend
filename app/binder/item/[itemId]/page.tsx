import PublicBinderItem from "@/components/binder/PublicBinderItem";

export default async function BinderItemPage({ params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;
  return <PublicBinderItem itemId={itemId} />;
}
