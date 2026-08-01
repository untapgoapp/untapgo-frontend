"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

export default function BinderModal({
  open,
  title,
  description,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] grid items-end bg-black/40 p-0 sm:place-items-center sm:p-5" onMouseDown={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="binder-modal-title"
        className="max-h-[94vh] w-full overflow-y-auto rounded-t-[1.5rem] bg-background p-5 shadow-overlay sm:max-w-3xl sm:rounded-surface sm:p-6"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 id="binder-modal-title" className="text-xl font-bold tracking-tight">{title}</h2>
            {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
          </div>
          <Button type="button" variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
            <X aria-hidden="true" />
          </Button>
        </header>
        <div className="mt-5">{children}</div>
      </section>
    </div>
  );
}
