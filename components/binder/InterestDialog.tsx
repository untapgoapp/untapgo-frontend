"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  INTEREST_LABELS,
  allowedInterestTypes,
  type BinderItem,
  type InterestType,
} from "@/lib/binder";

import BinderModal from "./BinderModal";

const selectClass = "h-11 w-full rounded-control border border-input bg-surface px-3 text-sm outline-none focus:border-primary/45 focus:ring-[3px] focus:ring-ring/12";

export default function InterestDialog({ item, saving, error, onClose, onSubmit }: {
  item: BinderItem | null;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (type: InterestType, message: string | null) => Promise<void>;
}) {
  const choices = item ? allowedInterestTypes(item.availability) : [];
  const [type, setType] = useState<InterestType>(choices[0] ?? "trade");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setType(choices[0] ?? "trade");
    setMessage("");
  }, [item?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!item || !choices.includes(type)) return;
    await onSubmit(type, message.trim() || null);
  }

  return (
    <BinderModal open={Boolean(item)} title={`Interest in ${item?.card_name ?? "card"}`} description="Send a structured request to the Binder owner." onClose={() => { if (!saving) onClose(); }}>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-semibold"><span className="mb-2 block">Interest type</span><select value={type} onChange={(event) => setType(event.target.value as InterestType)} className={selectClass}>{choices.map((value) => <option key={value} value={value}>{INTEREST_LABELS[value]}</option>)}</select></label>
        <label className="block text-sm font-semibold"><span className="mb-2 block">Message (optional)</span><textarea value={message} maxLength={1000} onChange={(event) => setMessage(event.target.value)} className={`${selectClass} min-h-28 py-3`} placeholder="For example: I may have cards from your Wanted List." /></label>
        <p className="rounded-row bg-surface-subtle px-3 py-3 text-xs leading-5 text-muted-foreground">UntapGo helps players connect. Payment, delivery and card verification are arranged between users.</p>
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Sending…" : "Send interest"}</Button></div>
      </form>
    </BinderModal>
  );
}
