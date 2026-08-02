import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, Bookmark, Heart } from "lucide-react";

import FavoritePlayersView from "@/components/profile/favorites/FavoritePlayersView";
import SavedPostsView from "@/components/profile/favorites/SavedPostsView";

export default async function FavoritesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string | string[] }>;
}) {
  const resolved = await searchParams;
  const requested = Array.isArray(resolved.view) ? resolved.view[0] : resolved.view;
  const view = requested === "posts" ? "posts" : "players";

  return (
    <main className="min-h-screen px-4 py-6 text-foreground sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-[760px]">
        <Link href="/profile" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to profile
        </Link>

        <header className="mt-6">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-primary">Your library</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em]">Favorites</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Keep favorite players and useful community posts in one place.
          </p>
        </header>

        <nav aria-label="Favorite sections" className="mt-6 flex gap-2 border-b border-border/70">
          <FavoriteTab href="/profile/favorites?view=players" label="Players" active={view === "players"} icon={Heart} />
          <FavoriteTab href="/profile/favorites?view=posts" label="Saved posts" active={view === "posts"} icon={Bookmark} />
        </nav>

        {view === "posts" ? <SavedPostsView /> : <FavoritePlayersView />}
      </div>
    </main>
  );
}

function FavoriteTab({
  href,
  label,
  active,
  icon: Icon,
}: {
  href: string;
  label: string;
  active: boolean;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={[
        "relative flex min-h-12 items-center gap-2 px-3 text-sm font-semibold",
        active
          ? "text-foreground after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary"
          : "text-muted-foreground hover:text-foreground",
      ].join(" ")}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </Link>
  );
}
