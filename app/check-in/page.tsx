import Link from "next/link";
import {
  ArrowLeft,
} from "lucide-react";

import DirectQrCheckIn from "@/components/events/DirectQrCheckIn";

export default async function CheckInPage({
  searchParams,
}: {
  searchParams: Promise<{
    token?: string;
  }>;
}) {
  const {
    token = "",
  } =
    await searchParams;

  return (
    <main className="min-h-screen bg-[#F8F5EF] px-5 py-12 text-zinc-950">
      <div className="mx-auto max-w-lg">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 transition hover:text-black"
        >
          <ArrowLeft size={16} />
          Back to events
        </Link>

        <div className="mt-8">
          <DirectQrCheckIn
            token={token}
          />
        </div>
      </div>
    </main>
  );
}
