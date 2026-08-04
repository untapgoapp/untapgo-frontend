import TradeConversation from "@/components/binder/TradeConversation";

export default async function TradePage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;
  return <TradeConversation threadId={threadId} />;
}
