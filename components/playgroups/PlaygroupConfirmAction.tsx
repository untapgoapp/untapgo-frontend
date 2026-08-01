"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";

export default function PlaygroupConfirmAction({
  trigger,
  title,
  description,
  confirmLabel,
  busyLabel,
  errorMessage,
  disabled = false,
  onConfirm,
}: {
  trigger: ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  busyLabel: string;
  errorMessage: string;
  disabled?: boolean;
  onConfirm: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const busyRef = useRef(false);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  async function confirm() {
    if (busyRef.current || disabled) return;
    busyRef.current = true;
    setBusy(true);
    setError(false);
    try {
      await onConfirm();
      setOpen(false);
    } catch {
      setError(true);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => { setOpen(true); setError(false); }}
        className="inline-flex min-h-8 items-center rounded-control px-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-destructive-subtle hover:text-destructive focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20 disabled:hidden"
      >
        {trigger}
      </button>
    );
  }

  return (
    <div role="alertdialog" aria-label={title} className="mt-2 rounded-control bg-destructive-subtle px-3 py-3 text-left">
      <p className="text-sm font-bold text-destructive">{title}</p>
      <p className="mt-1 text-xs leading-5 text-destructive/85">{description}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button type="button" variant="destructive" size="xs" disabled={busy} onClick={() => void confirm()}>
          {busy ? busyLabel : confirmLabel}
        </Button>
        <Button type="button" variant="ghost" size="xs" disabled={busy} onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
      {error ? <p role="alert" className="mt-2 text-xs text-destructive">{errorMessage}</p> : null}
    </div>
  );
}
