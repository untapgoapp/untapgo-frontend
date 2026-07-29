import Link from "next/link";
import {
  ArrowLeft,
} from "lucide-react";

import EventForm from "@/components/events/EventForm";

export default function CreateEventPage() {
  return (
    <main className="min-h-screen bg-[#F8F5EF] px-5 py-12 text-zinc-950">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 transition hover:text-black"
        >
          <ArrowLeft size={16} />
          Back to events
        </Link>

        <header className="mt-8 border-b border-black/10 pb-8">
          <p className="text-sm font-semibold text-[#6E5AA7]">
            Host a table
          </p>

          <h1 className="mt-2 text-4xl font-black tracking-tight">
            Create event
          </h1>

          <p className="mt-3 max-w-xl text-[15px] leading-6 text-zinc-600">
            Choose when and where to
            play, set the table rules
            and decide whether you are
            joining as a player.
          </p>
        </header>

        <section className="mt-8">
          <EventForm mode="create" />
        </section>
      </div>
    </main>
  );
}