"use client";

import Link from "next/link";
import { Plus, Share2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import SectionNavigation from "@/components/section-navigation/SectionNavigation";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";
import { normalizeBinderView, type BinderView } from "@/lib/binder";
import { shareBinderLink } from "@/lib/binder-share";
import { binderApi } from "@/services/binder";
import { getPublicProfile } from "@/services/profiles";

import BinderItemsView from "./BinderItemsView";
import BinderSettingsPanel from "./BinderSettingsPanel";
import CommunityBinderView from "./CommunityBinderView";
import InterestsView from "./InterestsView";
import MatchesView from "./MatchesView";
import TradeThreadsView from "./TradeThreadsView";
import WantedListView from "./WantedListView";

const pageIdentity: Record<BinderView, { title: string; subtitle: string }> = {
  community: {
    title: "Community Binders",
    subtitle: "Browse public Binders from other UntapGo players.",
  },
  items: {
    title: "My Binder",
    subtitle: "Manage cards you are open to trading or selling.",
  },
  wanted: {
    title: "Wanted List",
    subtitle: "Keep track of the cards you are looking for.",
  },
  matches: {
    title: "Matches",
    subtitle: "Find public listings that match your Wanted List.",
  },
  received: {
    title: "Trade requests",
    subtitle: "Review interest in your cards and requests you sent.",
  },
  sent: {
    title: "Trade requests",
    subtitle: "Review interest in your cards and requests you sent.",
  },
  trades: {
    title: "Active trades",
    subtitle: "Private conversations for accepted Binder requests.",
  },
};

const requestTabs: Array<["received" | "sent", string]> = [
  ["received", "Received"],
  ["sent", "Sent"],
];

export default function BinderDashboard() {
  const searchParams = useSearchParams();
  const { user } = useUser();
  const view = normalizeBinderView(searchParams.get("view"));
  const [addRequest, setAddRequest] = useState(0);
  const [sharing, setSharing] = useState(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const identity = pageIdentity[view];

  async function shareMyBinder() {
    if (!user?.id || sharing) return;
    setSharing(true);
    setShareStatus(null);

    try {
      const settings = await binderApi.settings();
      if (settings.visibility !== "public") {
        setShareStatus("Make your Binder public before sharing it.");
        return;
      }

      const profile = await getPublicProfile(user.id);
      const nickname = profile.nickname?.trim() || "UntapGo player";
      const outcome = await shareBinderLink({ ownerId: user.id, nickname });
      if (outcome === "copied") setShareStatus("Binder link copied.");
      if (outcome === "shared") setShareStatus("Binder shared.");
    } catch {
      setShareStatus("Binder link could not be shared. Please try again.");
    } finally {
      setSharing(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-6 text-foreground sm:px-5 sm:py-8 lg:px-0">
      <div className="w-full max-w-[1180px]">
        <SectionNavigation
          section="binder"
          activeKey={view === "received" || view === "sent" ? "requests" : view}
        />
        <div className="mt-6 min-w-0 lg:mt-0">
          <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border/60 pb-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">
                Binder
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-[-0.035em]">
                {identity.title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                {identity.subtitle}
              </p>
            </div>

            {view === "items" ? (
              <div className="flex flex-col items-end gap-2">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={sharing}
                    onClick={() => void shareMyBinder()}
                  >
                    <Share2 aria-hidden="true" />
                    {sharing ? "Sharing…" : "Share Binder"}
                  </Button>
                  <Button type="button" onClick={() => setAddRequest((value) => value + 1)}>
                    <Plus aria-hidden="true" />
                    Add card
                  </Button>
                </div>
                {shareStatus ? (
                  <p role="status" className="max-w-80 text-right text-xs text-muted-foreground">
                    {shareStatus}
                  </p>
                ) : null}
              </div>
            ) : null}
          </header>

          {view === "items" ? (
            <div className="mt-4">
              <BinderSettingsPanel />
            </div>
          ) : null}
          {view === "received" || view === "sent" ? (
            <TradeRequestNav view={view} />
          ) : null}

          <div className="py-6">
            {view === "community" ? <CommunityBinderView /> : null}
            {view === "items" ? <BinderItemsView addRequest={addRequest} /> : null}
            {view === "wanted" ? <WantedListView /> : null}
            {view === "matches" ? <MatchesView /> : null}
            {view === "received" || view === "sent" ? <InterestsView view={view} /> : null}
            {view === "trades" ? <TradeThreadsView /> : null}
          </div>
        </div>
      </div>
    </main>
  );
}

function TradeRequestNav({ view }: { view: "received" | "sent" }) {
  return (
    <nav aria-label="Trade request views" className="mt-4 flex gap-1">
      {requestTabs.map(([key, label]) => (
        <Link
          key={key}
          href={`/binder?view=${key}`}
          aria-current={view === key ? "page" : undefined}
          className={`rounded-control px-3 py-2 text-sm font-semibold ${
            view === key
              ? "bg-secondary text-secondary-foreground"
              : "text-muted-foreground hover:bg-surface-subtle"
          }`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
