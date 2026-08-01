"use client";

import { useReducer, useState } from "react";
import { Archive, Pencil } from "lucide-react";

import PlaygroupForm from "@/components/playgroups/PlaygroupForm";
import { Button } from "@/components/ui/button";
import { archiveConfirmationReducer } from "@/lib/playgroups";
import { archivePlaygroup, type PlaygroupDetail } from "@/services/playgroups";

export default function PlaygroupOwnerTools({
  group,
  onUpdated,
}: {
  group: PlaygroupDetail;
  onUpdated: (group: PlaygroupDetail) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [archiveState, dispatchArchive] = useReducer(archiveConfirmationReducer, "idle");
  const [error, setError] = useState<string | null>(null);

  if (group.status === "archived") return null;

  async function archive() {
    if (archiveState !== "confirming") return;
    dispatchArchive("submit");
    setError(null);
    try {
      const updated = await archivePlaygroup(group.id);
      dispatchArchive("succeeded");
      onUpdated(updated);
    } catch {
      setError("Could not archive this playgroup. Please try again.");
      dispatchArchive("failed");
    }
  }

  return (
    <section aria-labelledby="playgroup-owner-tools-title" className="py-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="playgroup-owner-tools-title" className="text-lg font-semibold tracking-tight">Owner tools</h2>
          <p className="mt-1 text-sm text-muted-foreground">Keep the group details current or archive it when it is no longer active.</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => { setEditing((value) => !value); dispatchArchive("cancel"); }}>
            <Pencil size={14} aria-hidden="true" /> Edit group
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => { dispatchArchive("request"); setEditing(false); }}>
            <Archive size={14} aria-hidden="true" /> Archive
          </Button>
        </div>
      </div>

      {editing ? (
        <div className="mt-5 max-w-2xl rounded-surface bg-surface-subtle/70 p-4 sm:p-5">
          <PlaygroupForm
            key={`${group.id}:${group.name}:${group.join_policy}`}
            mode="edit"
            initialGroup={group}
            onCancel={() => setEditing(false)}
            onSaved={(updated) => { setEditing(false); onUpdated(updated); }}
          />
        </div>
      ) : null}

      {archiveState !== "idle" ? (
        <div role="alertdialog" aria-labelledby="archive-playgroup-title" className="mt-5 max-w-xl rounded-surface bg-destructive-subtle px-4 py-4">
          <h3 id="archive-playgroup-title" className="text-sm font-bold text-destructive">Archive this playgroup?</h3>
          <p className="mt-1 text-sm leading-6 text-destructive/85">Archived groups stay available to existing members but cannot accept new members or requests. This does not delete the group or its members.</p>
          <div className="mt-3 flex gap-2">
            <Button type="button" variant="destructive" size="sm" onClick={() => void archive()} disabled={archiveState === "submitting"}>{archiveState === "submitting" ? "Archiving..." : "Archive playgroup"}</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => dispatchArchive("cancel")} disabled={archiveState === "submitting"}>Keep active</Button>
          </div>
        </div>
      ) : null}

      {error ? <p role="alert" className="mt-3 rounded-control bg-destructive-subtle px-3 py-2.5 text-sm text-destructive">{error}</p> : null}
    </section>
  );
}
