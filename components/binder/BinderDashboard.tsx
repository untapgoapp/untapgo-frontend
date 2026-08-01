"use client";

import Link from "next/link";
import { Plus, UsersRound } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { normalizeBinderView, type BinderView } from "@/lib/binder";

import BinderItemsView from "./BinderItemsView";
import BinderSettingsPanel from "./BinderSettingsPanel";
import InterestsView from "./InterestsView";
import MatchesView from "./MatchesView";
import WantedListView from "./WantedListView";

const tabs: Array<{ view: BinderView; label: string; active: (view: BinderView) => boolean }> = [
  { view: "community", label: "Community", active: (view) => view === "community" },
  { view: "items", label: "My Binder", active: (view) => view === "items" },
  { view: "wanted", label: "Wanted List", active: (view) => view === "wanted" },
  { view: "matches", label: "Matches", active: (view) => view === "matches" },
  { view: "received", label: "Trade requests", active: (view) => view === "received" || view === "sent" },
];

const requestTabs: Array<["received" | "sent", string]> = [
  ["received", "Received"],
  ["sent", "Sent"],
];

export default function BinderDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = normalizeBinderView(searchParams.get("view"));
  const [addRequest, setAddRequest] = useState(0);

  function addCard() {
    setAddRequest((value) => value + 1);
    if (view !== "items") router.replace("/binder?view=items");
  }

  return (
    <main className="min-h-screen px-4 py-6 text-foreground sm:px-5 sm:py-8 lg:px-0">
      <div className="w-full max-w-[1120px]">
        <header className="flex flex-wrap items-end justify-between gap-4 pb-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">Collection</p>
            <h1 className="mt-1 text-3xl font-bold tracking-[-0.035em]">Binder</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Browse community cards or manage cards you are open to trading or selling.</p>
          </div>
          <Button type="button" onClick={addCard}><Plus aria-hidden="true" />Add card</Button>
        </header>

        <nav aria-label="Binder views" className="mt-3 flex gap-1 overflow-x-auto rounded-control bg-surface-subtle p-1">
          {tabs.map((item) => (
            <Link
              key={item.view}
              href={`/binder?view=${item.view}`}
              aria-current={item.active(view) ? "page" : undefined}
              className={`shrink-0 rounded-control px-3 py-2 text-sm font-semibold outline-none transition focus-visible:ring-[3px] focus-visible:ring-ring/20 ${item.active(view) ? "bg-surface text-secondary-foreground shadow-surface" : "text-muted-foreground hover:text-foreground"}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {view !== "community" ? <div className="mt-4"><BinderSettingsPanel /></div> : null}
        {view === "received" || view === "sent" ? <TradeRequestNav view={view} /> : null}

        <div className="py-7">
          {view === "community" ? <BinderCommunityState /> : null}
          {view === "items" ? <BinderItemsView addRequest={addRequest} /> : null}
          {view === "wanted" ? <WantedListView /> : null}
          {view === "matches" ? <MatchesView /> : null}
          {view === "received" || view === "sent" ? <InterestsView view={view} /> : null}
        </div>
      </div>
    </main>
  );
}

function TradeRequestNav({ view }: { view: "received" | "sent" }) {
  return (
    <nav aria-label="Trade request views" className="mt-4 flex gap-1">
      {requestTabs.map(([key, label]) => (
        <Link key={key} href={`/binder?view=${key}`} aria-current={view === key ? "page" : undefined} className={`rounded-control px-3 py-2 text-sm font-semibold ${view === key ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-surface-subtle"}`}>{label}</Link>
      ))}
    </nav>
  );
}

function BinderCommunityState() {
  return (
    <section aria-labelledby="binder-community-title" className="py-8 text-center sm:py-12">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-secondary text-secondary-foreground"><UsersRound aria-hidden="true" className="h-5 w-5" /></span>
      <h2 id="binder-community-title" className="mt-4 text-lg font-bold">Community Binder discovery is not available yet</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">UntapGo needs a privacy-safe paginated discovery endpoint before community listings can appear here.</p>
      <Link href="/binder?view=items" className="mt-4 inline-flex min-h-10 items-center rounded-control px-3 text-sm font-semibold text-primary hover:bg-secondary/55">Open My Binder</Link>
    </section>
  );
}
