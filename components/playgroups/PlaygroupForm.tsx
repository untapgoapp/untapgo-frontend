"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  canStartPlaygroupSubmission,
  getPlaygroupFormValues,
  normalizePlaygroupPayload,
  type PlaygroupDetail,
  type PlaygroupFieldErrors,
  type PlaygroupFormValues,
} from "@/lib/playgroups";
import { createPlaygroup, editPlaygroup } from "@/services/playgroups";

const textareaClass = "min-h-28 w-full resize-y rounded-control border border-input bg-surface px-3.5 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-quiet-foreground focus-visible:border-primary/45 focus-visible:ring-[3px] focus-visible:ring-ring/12 disabled:bg-muted/60";
const selectClass = "h-11 w-full rounded-control border border-input bg-surface px-3.5 text-sm text-foreground outline-none focus-visible:border-primary/45 focus-visible:ring-[3px] focus-visible:ring-ring/12 disabled:bg-muted/60";

function FieldError({ message }: { message?: string }) {
  return message ? <span className="text-xs text-destructive">{message}</span> : null;
}

export default function PlaygroupForm({
  mode,
  initialGroup,
  onSaved,
  onCancel,
}: {
  mode: "create" | "edit";
  initialGroup?: PlaygroupDetail;
  onSaved?: (group: PlaygroupDetail) => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [values, setValues] = useState<PlaygroupFormValues>(() => getPlaygroupFormValues(initialGroup));
  const [errors, setErrors] = useState<PlaygroupFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update<Key extends keyof PlaygroupFormValues>(key: Key, value: PlaygroupFormValues[Key]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canStartPlaygroupSubmission(submitting)) return;
    const normalized = normalizePlaygroupPayload(values);
    if (!normalized.ok) {
      setErrors(normalized.errors);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const group = mode === "create"
        ? await createPlaygroup(normalized.payload)
        : await editPlaygroup(initialGroup!.id, normalized.payload);
      if (mode === "create") {
        router.push(`/playgroups/${encodeURIComponent(group.id)}`);
      } else {
        onSaved?.(group);
      }
    } catch {
      setSubmitError(mode === "create"
        ? "Could not create this playgroup. Check the fields and try again."
        : "Could not save these changes. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-5" noValidate>
      <label className="grid gap-1.5 text-sm font-semibold">
        Name
        <Input value={values.name} onChange={(event) => update("name", event.target.value)} minLength={3} maxLength={80} required aria-invalid={Boolean(errors.name)} />
        <FieldError message={errors.name} />
      </label>

      <label className="grid gap-1.5 text-sm font-semibold">
        Description <span className="font-normal text-quiet-foreground">Optional</span>
        <textarea value={values.description} onChange={(event) => update("description", event.target.value)} maxLength={600} rows={4} className={textareaClass} aria-invalid={Boolean(errors.description)} placeholder="What formats, nights or kinds of games bring this group together?" />
        <span className="flex justify-between gap-3"><FieldError message={errors.description} /><span className="ml-auto text-xs font-normal text-quiet-foreground">{values.description.length}/600</span></span>
      </label>

      <label className="grid gap-1.5 text-sm font-semibold">
        Avatar URL <span className="font-normal text-quiet-foreground">Optional</span>
        <Input type="url" value={values.avatarUrl} onChange={(event) => update("avatarUrl", event.target.value)} maxLength={2048} placeholder="https://example.com/group-avatar.jpg" aria-invalid={Boolean(errors.avatarUrl)} />
        <span className="text-xs font-normal leading-5 text-quiet-foreground">Use a direct image URL. Image upload is not available yet.</span>
        <FieldError message={errors.avatarUrl} />
      </label>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_9rem]">
        <label className="grid gap-1.5 text-sm font-semibold">
          City <span className="font-normal text-quiet-foreground">Optional</span>
          <Input value={values.city} onChange={(event) => update("city", event.target.value)} maxLength={100} autoComplete="address-level2" aria-invalid={Boolean(errors.city)} />
          <FieldError message={errors.city} />
        </label>
        <label className="grid gap-1.5 text-sm font-semibold">
          Country code <span className="font-normal text-quiet-foreground">Optional</span>
          <Input value={values.countryCode} onChange={(event) => update("countryCode", event.target.value.toUpperCase())} maxLength={2} autoCapitalize="characters" placeholder="EE" aria-invalid={Boolean(errors.countryCode)} />
          <FieldError message={errors.countryCode} />
        </label>
      </div>

      <label className="grid gap-1.5 text-sm font-semibold">
        Join policy
        <select value={values.joinPolicy} onChange={(event) => update("joinPolicy", event.target.value as PlaygroupFormValues["joinPolicy"])} className={selectClass}>
          <option value="open">Open — players join immediately</option>
          <option value="approval">Approval required — owner reviews requests</option>
        </select>
      </label>

      {submitError ? <p role="alert" className="rounded-control bg-destructive-subtle px-3 py-2.5 text-sm text-destructive">{submitError}</p> : null}

      <div className="flex flex-wrap gap-2 pt-1">
        <Button type="submit" disabled={submitting}>
          {submitting ? (mode === "create" ? "Creating..." : "Saving...") : (mode === "create" ? "Create playgroup" : "Save changes")}
        </Button>
        {mode === "edit" ? <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>Cancel</Button> : null}
      </div>
    </form>
  );
}
