import {
  formatTrustRate,
  getHostTrustText,
  getPlayerTrustText,
  type HostTrustSummary,
  type PlayerTrustSummary,
  type ProfileTrustSummary,
} from "@/lib/profile-trust";

type ProfileTrustSectionProps = {
  summary: ProfileTrustSummary | null;
  failed?: boolean;
};

function PlayerMeasure({ metric }: { metric: PlayerTrustSummary }) {
  const rate = formatTrustRate(metric.rate, metric.display_state);

  return (
    <div className="min-w-0 px-4 py-3.5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">Verified attendance</h3>
        {rate ? <span className="text-sm font-semibold text-primary">{rate}</span> : null}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{getPlayerTrustText(metric)}</p>
    </div>
  );
}

function HostMeasure({ metric }: { metric: HostTrustSummary }) {
  const rate = formatTrustRate(metric.rate, metric.display_state);

  return (
    <div className="min-w-0 px-4 py-3.5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">Events fulfilled</h3>
        {rate ? <span className="text-sm font-semibold text-primary">{rate}</span> : null}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{getHostTrustText(metric)}</p>
    </div>
  );
}

export default function ProfileTrustSection({
  summary,
  failed = false,
}: ProfileTrustSectionProps) {
  const isPrivate = summary?.player.display_state === "private"
    && summary.host.display_state === "private";

  return (
    <section id="trust" aria-labelledby="profile-trust-title" className="scroll-mt-6 py-6">
      <h2 id="profile-trust-title" className="text-lg font-semibold tracking-tight">Trust</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Based only on completed events and verified check-ins.
      </p>

      {failed ? (
        <p className="mt-3 rounded-row bg-surface-subtle px-4 py-3 text-sm text-muted-foreground">
          Trust summary is unavailable right now.
        </p>
      ) : isPrivate ? (
        <p className="mt-3 rounded-row bg-surface-subtle px-4 py-3 text-sm text-muted-foreground">
          This player keeps event statistics private.
        </p>
      ) : summary ? (
        <div className="mt-3 grid overflow-hidden rounded-surface bg-surface/55 md:grid-cols-2 md:divide-x md:divide-border/60">
          <PlayerMeasure metric={summary.player} />
          <HostMeasure metric={summary.host} />
        </div>
      ) : (
        <div aria-label="Loading trust summary" className="mt-3 grid gap-2 md:grid-cols-2">
          <div className="h-20 animate-pulse rounded-row bg-surface-subtle" />
          <div className="h-20 animate-pulse rounded-row bg-surface-subtle" />
        </div>
      )}

      <p className="mt-2 text-xs leading-5 text-quiet-foreground">
        Attendance counts only finalized host or QR verification; joining alone does not count. Host fulfilment compares completed with host-cancelled eligible events.
      </p>
    </section>
  );
}
