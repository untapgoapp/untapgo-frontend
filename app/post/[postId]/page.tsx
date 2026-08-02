import SocialPostDetail from "@/components/social-feed/SocialPostDetail";

export default async function SocialPostPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  return <SocialPostDetail postId={postId} />;
}
