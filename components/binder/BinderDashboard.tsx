"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { normalizeBinderView, type BinderView } from "@/lib/binder";

import BinderItemsView from "./BinderItemsView";
import BinderSettingsPanel from "./BinderSettingsPanel";
import InterestsView from "./InterestsView";
import MatchesView from "./MatchesView";
import WantedListView from "./WantedListView";

const tabs: Array<[BinderView, string]> = [
  ["items", "My Binder"],
  ["wanted", "Wanted List"],
  ["matches", "Matches"],
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
          <div><p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">Collection</p><h1 className="mt-1 text-3xl font-bold tracking-[-0.035em]">Binder</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Manage cards you are open to trading or selling.</p></div>
          <Button type="button" onClick={addCard}><Plus aria-hidden="true" />Add card</Button>
        </header>

        <div className="mt-2"><BinderSettingsPanel /></div>
        <nav aria-label="Binder views" className="mt-5 flex gap-1 overflow-x-auto rounded-control bg-surface-subtle p-1">
          {tabs.map(([key, label]) => <Link key={key} href={`/binder?view=${key}`} aria-current={view === key ? "page" : undefined} className={`shrink-0 rounded-control px-3 py-2 text-sm font-semibold outline-none transition focus-visible:ring-[3px] focus-visible:ring-ring/20 ${view === key ? "bg-surface text-secondary-foreground shadow-surface" : "text-muted-foreground hover:text-foreground"}`}>{label}</Link>)}
        </nav>

        <div className="py-7">
          {view === "items" ? <BinderItemsView addRequest={addRequest} /> : null}
          {view === "wanted" ? <WantedListView /> : null}
          {view === "matches" ? <MatchesView /> : null}
          {view === "received" || view === "sent" ? <InterestsView view={view} /> : null}
        </div>
      </div>
    </main>
  );
}
