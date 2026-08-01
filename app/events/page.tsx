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
    <main className="min-h-screen bg-background text-foreground">
      <Suspense
        fallback={
          <div className="w-full max-w-[1100px] px-4 py-8 sm:px-5">
            <p className="text-sm text-muted-foreground">
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
