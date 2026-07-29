import { Suspense } from "react";

import EventsBrowser from "@/components/events/EventsBrowser";
import {
  getEvents,
  type EventItem,
} from "@/services/events";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EventsPage() {
  const events: EventItem[] = await getEvents().catch(
    (error: unknown) => {
      console.error(
        "Failed to load public events:",
        error,
      );

      return [];
    },
  );

  return (
    <main className="min-h-screen bg-[#F8F5EF] text-black">
      <Suspense
        fallback={
          <div className="mx-auto max-w-3xl px-5 py-12">
            <p className="text-sm text-zinc-500">
              Loading events...
            </p>
          </div>
        }
      >
        <EventsBrowser initialEvents={events} />
      </Suspense>
    </main>
  );
}