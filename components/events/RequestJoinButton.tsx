"use client";

import { useState } from "react";
import { joinEvent } from "@/services/events";

type RequestJoinButtonProps = {
  eventId: string;
};

export default function RequestJoinButton({ eventId }: RequestJoinButtonProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin() {
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const result = await joinEvent(eventId);

      const myStatus =
        result && typeof result === "object" && "my_status" in result
          ? String(result.my_status)
          : null;

      const alreadyRequested =
        result && typeof result === "object" && "already_requested" in result
          ? Boolean(result.already_requested)
          : false;

      const alreadyJoined =
        result && typeof result === "object" && "already_joined" in result
          ? Boolean(result.already_joined)
          : false;

      if (alreadyJoined || myStatus === "joined") {
        setMessage("You are already in this event.");
      } else if (alreadyRequested || myStatus === "pending") {
        setMessage("Request already sent. Waiting for the host.");
      } else {
        setMessage("Request sent. Waiting for the host to accept.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not request to join.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleJoin}
        disabled={loading}
        className="w-full rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Sending request..." : "Request to join"}
      </button>

      {message ? (
        <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}

      {error ? (
        <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </pre>
      ) : null}
    </div>
  );
}