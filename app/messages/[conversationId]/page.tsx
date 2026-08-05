import DirectConversation from "@/components/messages/DirectConversation";

export default async function DirectMessagePage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  return <DirectConversation conversationId={conversationId} />;
}
