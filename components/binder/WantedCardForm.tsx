/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CONDITION_LABELS,
  FINISH_LABELS,
  type CardCondition,
  type CardFinish,
  type WantedCard,
  type WantedCardInput,
} from "@/lib/binder";
import type { ScryfallCard } from "@/types/decks";

import CardPrintingSelector from "./CardPrintingSelector";

const selectClass = "h-11 w-full rounded-control border border-input bg-surface px-3 text-sm outline-none focus:border-primary/45 focus:ring-[3px] focus:ring-ring/12";
const conditions = Object.keys(CONDITION_LABELS) as CardCondition[];
const finishes = Object.keys(FINISH_LABELS) as CardFinish[];
const languages = ["en", "es", "fr", "de", "it", "pt", "ja", "ko", "ru", "zhs", "zht"];

export default function WantedCardForm({ initial, saving, error, onSave, onCancel }: {
  initial?: WantedCard;
  saving: boolean;
  error: string | null;
  onSave: (input: WantedCardInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [card, setCard] = useState<ScryfallCard | null>(null);
  const [replaceCard, setReplaceCard] = useState(false);
  const [anyPrinting, setAnyPrinting] = useState(initial ? !initial.preferred_scryfall_card_id : true);
  const [quantity, setQuantity] = useState(initial?.quantity ?? 1);
  const [condition, setCondition] = useState<CardCondition | "">(initial?.minimum_condition ?? "");
  const [language, setLanguage] = useState(initial?.preferred_language ?? "");
  const [finish, setFinish] = useState<CardFinish | "">(initial?.preferred_finish ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [validation, setValidation] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    setValidation(null);
    if ((!initial || replaceCard) && !card) return setValidation("Select a card first.");
    await onSave({
      scryfall_card_id: card?.id,
      match_any_printing: anyPrinting,
      quantity,
      minimum_condition: condition || null,
      preferred_language: language || null,
      preferred_finish: finish || null,
      notes: notes.trim() || null,
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {initial && !replaceCard ? (
        <div className="flex items-center gap-3 rounded-surface bg-surface-subtle p-3">
          {initial.image_url ? <img src={initial.image_url} alt="" className="w-14 rounded-md" /> : null}
          <div className="min-w-0 flex-1"><p className="font-semibold">{initial.card_name}</p><p className="text-sm text-muted-foreground">{initial.preferred_set_code ? `${initial.preferred_set_code.toUpperCase()} · #${initial.preferred_collector_number}` : "Any printing"}</p></div>
          <Button type="button" variant="ghost" size="sm" onClick={() => setReplaceCard(true)}>Change card</Button>
        </div>
      ) : <CardPrintingSelector value={card} onChange={setCard} />}

      <label className="flex items-start gap-3 rounded-surface bg-secondary/55 p-3 text-sm">
        <input type="checkbox" checked={anyPrinting} onChange={(event) => setAnyPrinting(event.target.checked)} className="mt-0.5 h-4 w-4 accent-primary" />
        <span><strong className="block">Match any printing</strong><span className="text-muted-foreground">Match by card identity instead of requiring this exact edition.</span></span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Quantity"><Input type="number" min={1} max={999} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} /></Field>
        <Field label="Minimum condition"><select value={condition} onChange={(event) => setCondition(event.target.value as CardCondition | "")} className={selectClass}><option value="">Any condition</option>{conditions.map((value) => <option key={value} value={value}>{CONDITION_LABELS[value]}</option>)}</select></Field>
        <Field label="Preferred language"><select value={language} onChange={(event) => setLanguage(event.target.value)} className={selectClass}><option value="">Any language</option>{languages.map((value) => <option key={value} value={value}>{value.toUpperCase()}</option>)}</select></Field>
        <Field label="Preferred finish"><select value={finish} onChange={(event) => setFinish(event.target.value as CardFinish | "")} className={selectClass}><option value="">Any finish</option>{finishes.map((value) => <option key={value} value={value}>{FINISH_LABELS[value]}</option>)}</select></Field>
      </div>
      <Field label="Matching notes (public when your Wanted List is visible)"><textarea value={notes} maxLength={500} onChange={(event) => setNotes(event.target.value)} className={`${selectClass} min-h-24 py-3`} placeholder="Edition preferences or trade context" /></Field>
      {validation || error ? <p role="alert" className="text-sm text-destructive">{validation || error}</p> : null}
      <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Saving…" : initial ? "Save changes" : "Add wanted card"}</Button></div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-semibold"><span className="mb-2 block">{label}</span>{children}</label>;
}
