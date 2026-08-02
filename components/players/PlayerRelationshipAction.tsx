import {
  getProfileFollowActionLabel,
  type ProfileRelationship,
} from "@/lib/profile-follow";

export default function PlayerRelationshipAction({
  relationship,
  busy,
  blocked,
  error,
  onToggle,
}: {
  relationship: ProfileRelationship;
  busy: boolean;
  blocked: boolean;
  error?: string;
  onToggle: () => void | Promise<void>;
}) {
  if (blocked) return null;
  const following = relationship.is_following;
  const label = getProfileFollowActionLabel(relationship);

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void onToggle();
        }}
        disabled={busy}
        aria-busy={busy}
        aria-pressed={following}
        className={[
          "min-h-9 rounded-control px-3 text-xs font-bold outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/20 disabled:cursor-wait disabled:opacity-60",
          following
            ? "bg-secondary text-secondary-foreground hover:bg-secondary/75"
            : "bg-primary text-primary-foreground hover:bg-primary/90",
        ].join(" ")}
      >
        {busy ? "Updating…" : label}
      </button>
      {relationship.is_followed_by && !relationship.is_mutual ? <span className="text-[11px] font-medium text-quiet-foreground">Follows you</span> : null}
      {error ? <span role="alert" className="max-w-36 text-right text-[11px] text-destructive">{error}</span> : null}
    </div>
  );
}
