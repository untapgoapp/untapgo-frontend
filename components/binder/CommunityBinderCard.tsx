/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { ArrowRight, Layers3, MapPin } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CARD_LANGUAGE_LABELS, type CommunityBinderSummary } from "@/lib/binder";

function updatedLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently updated";
  return `Updated ${new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  }).format(date)}`;
}

function countLabel(value: number, singular: string, plural = `${singular}s`) {
  return `${value} ${value === 1 ? singular : plural}`;
}

export default function CommunityBinderCard({ binder }: { binder: CommunityBinderSummary }) {
  const href = `/profile/${encodeURIComponent(binder.owner.id)}/binder`;
  const location = binder.owner.location?.display_name || binder.proximity?.label;
  const availability = [
    binder.trade_count ? `${binder.trade_count} trade` : null,
    binder.sell_count ? `${binder.sell_count} sell` : null,
    binder.both_count ? `${binder.both_count} both` : null,
  ].filter(Boolean) as string[];

  return (
    <article className="group min-w-0 py-2">
      <div>
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="h-11 w-11 shrink-0">
            <AvatarImage src={binder.owner.avatar_url ?? undefined} alt="" />
            <AvatarFallback>{binder.owner.nickname.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <Link
              href={href}
              className="block truncate text-base font-bold tracking-[-0.015em] hover:text-primary"
            >
              {binder.owner.nickname}&apos;s Binder
            </Link>
            {location ? (
              <p className="mt-0.5 flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{location}</span>
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-muted-foreground">UntapGo player</p>
            )}
          </div>
        </div>

        <Link href={href} className="mt-4 block" aria-label={`Open ${binder.owner.nickname}'s Binder`}>
          {binder.preview_items.length ? (
            <div className="grid grid-cols-4 gap-1.5 overflow-hidden rounded-xl bg-surface-subtle p-1.5">
              {binder.preview_items.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="relative aspect-[5/7] overflow-hidden rounded-lg bg-secondary/60"
                  title={`${item.printed_name || item.card_name} · ${CARD_LANGUAGE_LABELS[item.language] || item.language.toUpperCase()}`}
                >
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt=""
                      className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.025]"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-primary/65">
                      <Layers3 aria-hidden="true" className="h-5 w-5" />
                    </div>
                  )}
                  {item.quantity > 1 ? (
                    <span className="absolute bottom-1 right-1 rounded-full bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      ×{item.quantity}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="grid h-28 place-items-center rounded-xl bg-secondary/45 text-sm text-muted-foreground">
              No card previews
            </div>
          )}
        </Link>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">
            {countLabel(binder.total_quantity, "card")}
          </span>
          <span>{countLabel(binder.active_item_count, "listing")}</span>
          <span>{updatedLabel(binder.updated_at)}</span>
        </div>

        {availability.length ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {availability.map((label) => (
              <span
                key={label}
                className="rounded-full bg-secondary/70 px-2 py-1 text-[11px] font-semibold text-secondary-foreground"
              >
                {label}
              </span>
            ))}
          </div>
        ) : null}

        <Link
          href={href}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/15"
        >
          Open
          <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}
