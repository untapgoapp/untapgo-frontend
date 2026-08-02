import Link from "next/link";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { SocialFeedView } from "@/lib/social-feed";

type HomeFeedEmptyStateProps = {
  view: SocialFeedView;
};

export default function HomeFeedEmptyState({
  view,
}: HomeFeedEmptyStateProps) {
  const following = view === "following";

  return (
    <section className="px-4 py-10 text-center sm:px-8 sm:py-12">
      <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-secondary text-secondary-foreground">
        <Sparkles className="h-5 w-5" aria-hidden="true" />
      </span>

      <h2 className="mt-4 text-lg font-bold tracking-[-0.025em]">
        {following ? "Your Following feed is quiet" : "Your feed is quiet for now"}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {following
          ? "Follow players to start seeing the posts they share on UntapGo."
          : "Be the first to post, or follow players to bring more activity into your feed."}
      </p>

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Button asChild size="sm">
          <Link href="/players?view=discover">Discover players</Link>
        </Button>
        {!following ? (
          <Button asChild size="sm" variant="outline">
            <Link href="/events">Find a game</Link>
          </Button>
        ) : null}
      </div>
    </section>
  );
}
