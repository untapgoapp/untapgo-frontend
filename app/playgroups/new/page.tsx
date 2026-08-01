import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import PlaygroupForm from "@/components/playgroups/PlaygroupForm";

export default function NewPlaygroupPage() {
  return (
    <main className="min-h-screen px-4 py-6 text-foreground sm:px-5 sm:py-8 lg:px-0">
      <div className="w-full max-w-[860px]">
        <Link href="/playgroups" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary">
          <ArrowLeft size={15} aria-hidden="true" /> Back to Playgroups
        </Link>
        <header className="mt-5 max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">Community</p>
          <h1 className="mt-1 text-3xl font-bold tracking-[-0.035em]">Create a playgroup</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Give regular players a place to find each other and keep playing together.</p>
        </header>
        <div className="mt-7 max-w-2xl">
          <PlaygroupForm mode="create" />
        </div>
      </div>
    </main>
  );
}
