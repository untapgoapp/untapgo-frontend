"use client";

import {
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import {
  useParams,
  useRouter,
} from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  LoaderCircle,
} from "lucide-react";

import EventForm from "@/components/events/EventForm";
import { supabase } from "@/lib/supabase/client";
import {
  getPrivateEvent,
  type EventItem,
} from "@/services/events";

function normalize(
  value?: string | null,
): string {
  return (value ?? "")
    .trim()
    .toLowerCase();
}

function getErrorMessage(
  error: unknown,
): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Could not load event.";

  const normalized =
    message.toUpperCase();

  if (
    normalized.includes(
      "EVENT_NOT_FOUND",
    )
  ) {
    return "This event could not be found.";
  }

  if (
    normalized.includes("NOT_HOST")
  ) {
    return "Only the host can edit this event.";
  }

  if (
    !message ||
    message === "[object Object]"
  ) {
    return "Could not load event.";
  }

  return message;
}

export default function EditEventPage() {
  const params =
    useParams<{
      eventId: string;
    }>();

  const router = useRouter();

  const eventId =
    String(params.eventId);

  const [event, setEvent] =
    useState<EventItem | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  useEffect(() => {
    let cancelled = false;

    async function loadEvent() {
      setLoading(true);
      setError(null);

      try {
        const {
          data,
          error: authError,
        } =
          await supabase.auth.getUser();

        if (authError) {
          throw authError;
        }

        if (!data.user) {
          router.replace(
            `/login?next=${encodeURIComponent(
              `/events/${eventId}/edit`,
            )}`,
          );

          return;
        }

        const loadedEvent =
          await getPrivateEvent(
            eventId,
          );

        if (cancelled) {
          return;
        }

        const isHost =
          String(
            loadedEvent.host_user_id,
          ) === data.user.id;

        if (!isHost) {
          setEvent(null);
          setError(
            "Only the host can edit this event.",
          );

          return;
        }

        const status = normalize(
          loadedEvent.status,
        );

        const canEdit =
          status === "open" ||
          status === "full";

        if (!canEdit) {
          setEvent(null);

          setError(
            status === "cancelled" ||
              status === "canceled"
              ? "Cancelled events cannot be edited."
              : status === "started" ||
                  status === "in_progress" ||
                  status === "in progress"
                ? "This event has already started and can no longer be edited."
                : "This event can no longer be edited.",
          );

          return;
        }

        setEvent(loadedEvent);
      } catch (loadError) {
        if (!cancelled) {
          setEvent(null);
          setError(
            getErrorMessage(
              loadError,
            ),
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadEvent();

    return () => {
      cancelled = true;
    };
  }, [eventId, router]);

  return (
    <main className="min-h-screen bg-[#F8F5EF] px-5 py-12 text-zinc-950">
      <div className="mx-auto max-w-2xl">
        <Link
          href={`/events/${eventId}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 transition hover:text-black"
        >
          <ArrowLeft size={16} />
          Back to event
        </Link>

        <header className="mt-8 border-b border-black/10 pb-8">
          <p className="text-sm font-semibold text-[#6E5AA7]">
            Host tools
          </p>

          <h1 className="mt-2 text-4xl font-black tracking-tight">
            Edit event
          </h1>

          <p className="mt-3 max-w-xl text-[15px] leading-6 text-zinc-600">
            Update the table details
            before the game starts.
          </p>
        </header>

        {loading ? (
          <LoadingState />
        ) : null}

        {!loading && error ? (
          <ErrorBox
            message={error}
            eventId={eventId}
          />
        ) : null}

        {!loading &&
        !error &&
        event ? (
          <section className="mt-8">
            <EventForm
              mode="edit"
              initialEvent={event}
            />
          </section>
        ) : null}
      </div>
    </main>
  );
}

function LoadingState() {
  return (
    <section className="mt-8 rounded-[1.35rem] border border-black/10 bg-white p-6">
      <div className="flex items-center gap-3 text-sm font-medium text-zinc-600">
        <LoaderCircle className="h-4 w-4 animate-spin text-[#6E5AA7]" />
        Loading event...
      </div>

      <div className="mt-6 grid gap-4">
        <div className="h-12 animate-pulse rounded-2xl bg-black/[0.06]" />
        <div className="h-24 animate-pulse rounded-2xl bg-black/[0.06]" />
        <div className="h-12 animate-pulse rounded-2xl bg-black/[0.06]" />
      </div>
    </section>
  );
}

function ErrorBox({
  message,
  eventId,
}: {
  message: string;
  eventId: string;
}) {
  return (
    <section className="mt-8 rounded-[1.35rem] border border-red-200 bg-red-50 p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

        <div>
          <h2 className="font-semibold text-red-800">
            Event cannot be edited
          </h2>

          <p className="mt-1 text-sm leading-6 text-red-700">
            {message}
          </p>
        </div>
      </div>

      <Link
        href={`/events/${eventId}`}
        className="mt-5 inline-flex rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:border-red-300"
      >
        Return to event
      </Link>
    </section>
  );
}
