/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AVAILABILITY_LABELS,
  CONDITION_LABELS,
  FINISH_LABELS,
  formatAskingPriceInput,
  parseOptionalAskingPrice,
  type BinderAvailability,
  type BinderItem,
  type BinderItemFormErrors,
  type BinderItemInput,
  type CardCondition,
  type CardFinish,
  type Currency,
} from "@/lib/binder";
import { decksApi } from "@/lib/decks-api";
import type { ScryfallCard } from "@/types/decks";

import CardPrintingSelector from "./CardPrintingSelector";

const selectClass = "h-11 w-full rounded-control border border-input bg-surface px-3 text-sm outline-none focus:border-primary/45 focus:ring-[3px] focus:ring-ring/12";
const conditions = Object.keys(CONDITION_LABELS) as CardCondition[];
const availabilities = Object.keys(AVAILABILITY_LABELS) as BinderAvailability[];
const currencies: Currency[] = ["USD", "EUR", "GBP", "CAD", "AUD"];

export default function BinderItemForm({
  initial,
  saving,
  error,
  onSave,
  onCancel,
  onClearError,
}: {
  initial?: BinderItem;
  saving: boolean;
  error: BinderItemFormErrors | null;
  onSave: (input: BinderItemInput) => Promise<void>;
  onCancel: () => void;
  onClearError: () => void;
}) {
  const [selectedCard, setSelectedCard] = useState<ScryfallCard | null>(null);
  const [language, setLanguage] = useState(initial?.language ?? "en");
  const [finish, setFinish] = useState<CardFinish>(initial?.finish ?? "nonfoil");
  const [condition, setCondition] = useState<CardCondition>(initial?.condition ?? "nm");
  const [quantity, setQuantity] = useState(initial?.quantity ?? 1);
  const [availability, setAvailability] = useState<BinderAvailability>(initial?.availability ?? "both");
  const [price, setPrice] = useState(
    initial?.asking_price === null || initial?.asking_price === undefined
      ? ""
      : Number(initial.asking_price).toFixed(2),
  );
  const [currency, setCurrency] = useState<Currency>(initial?.currency ?? "EUR");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [validation, setValidation] = useState<BinderItemFormErrors>({});
  const searchInputRef = useRef<HTMLInputElement>(null);
  const finishInputRef = useRef<HTMLSelectElement>(null);
  const priceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!initial) return;
    let active = true;
    void decksApi.cardById(initial.scryfall_card_id).then((result) => {
      if (active) setSelectedCard(result);
    }).catch(() => undefined);
    return () => { active = false; };
  }, [initial]);

  const finishes = useMemo(() => {
    const supported = selectedCard?.finishes?.filter((value): value is CardFinish => ["nonfoil", "foil", "etched"].includes(value)) ?? [];
    return supported.length ? supported : initial ? [initial.finish] : [];
  }, [selectedCard, initial]);

  useEffect(() => {
    if (error?.price) priceInputRef.current?.focus();
    else if (error?.card) searchInputRef.current?.focus();
    else if (error?.finish) finishInputRef.current?.focus();
  }, [error]);

  function clearErrors() {
    setValidation({});
    onClearError();
  }

  function selectCard(selected: ScryfallCard | null) {
    clearErrors();
    setSelectedCard(selected);
    if (!selected) return;
    setLanguage(selected.lang?.toLowerCase() || "en");
    const supported = selected.finishes ?? [];
    setFinish(supported.includes("nonfoil") ? "nonfoil" : supported[0] ?? "nonfoil");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    clearErrors();
    if (!initial && !selectedCard) {
      setValidation({ card: "Select an exact card printing." });
      searchInputRef.current?.focus();
      return;
    }
    if (!finishes.includes(finish)) {
      setValidation({ finish: "Choose a supported finish." });
      finishInputRef.current?.focus();
      return;
    }
    const parsedPrice = parseOptionalAskingPrice(price, currency);
    if (!parsedPrice.ok) {
      setValidation({ price: parsedPrice.message });
      priceInputRef.current?.focus();
      return;
    }
    await onSave({
      scryfall_card_id: initial ? undefined : selectedCard?.id,
      language,
      finish,
      condition,
      quantity,
      availability,
      asking_price: parsedPrice.asking_price,
      currency: parsedPrice.currency,
      notes: notes.trim() || null,
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {initial ? (
        <div className="flex items-center gap-3 rounded-surface bg-surface-subtle p-3">
          {initial.image_url ? <img src={initial.image_url} alt="" className="w-14 rounded-md" /> : null}
          <div><p className="font-semibold">{initial.card_name}</p><p className="text-sm text-muted-foreground">{initial.set_code.toUpperCase()} · #{initial.collector_number}</p></div>
        </div>
      ) : <CardPrintingSelector value={selectedCard} onChange={selectCard} inputRef={searchInputRef} fieldError={validation.card ?? error?.card} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Language"><Input value={language.toUpperCase()} disabled aria-label="Exact printing language" /></Field>
        <Field label="Finish" error={validation.finish ?? error?.finish}><select ref={finishInputRef} value={finish} onChange={(event) => { clearErrors(); setFinish(event.target.value as CardFinish); }} className={selectClass} disabled={!finishes.length} aria-invalid={Boolean(validation.finish ?? error?.finish)}>{finishes.map((value) => <option key={value} value={value}>{FINISH_LABELS[value]}</option>)}</select></Field>
        <Field label="Condition"><select value={condition} onChange={(event) => { clearErrors(); setCondition(event.target.value as CardCondition); }} className={selectClass}>{conditions.map((value) => <option key={value} value={value}>{CONDITION_LABELS[value]}</option>)}</select></Field>
        <Field label="Quantity" error={validation.quantity ?? error?.quantity}><Input type="number" min={1} max={999} value={quantity} onChange={(event) => { clearErrors(); setQuantity(Number(event.target.value)); }} aria-invalid={Boolean(validation.quantity ?? error?.quantity)} /></Field>
        <Field label="Available for" error={validation.availability ?? error?.availability}><select value={availability} onChange={(event) => { clearErrors(); setAvailability(event.target.value as BinderAvailability); }} className={selectClass} aria-invalid={Boolean(validation.availability ?? error?.availability)}>{availabilities.map((value) => <option key={value} value={value}>{AVAILABILITY_LABELS[value]}</option>)}</select></Field>
        <Field label="Asking price (optional)" error={validation.price ?? error?.price}>
          <div className="grid grid-cols-[1fr_5.5rem] gap-2">
            <Input
              ref={priceInputRef}
              type="number"
              min="0.01"
              max="9999999999.99"
              step="0.01"
              value={price}
              onChange={(event) => { clearErrors(); setPrice(event.target.value); }}
              onBlur={() => setPrice((current) => formatAskingPriceInput(current))}
              placeholder="0.00"
              aria-invalid={Boolean(validation.price ?? error?.price)}
            />
            <select value={price.trim() ? currency : ""} onChange={(event) => { clearErrors(); setCurrency(event.target.value as Currency); }} className={selectClass} disabled={!price.trim()} aria-label="Asking price currency">
              <option value="" disabled>Currency</option>
              {currencies.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>
        </Field>
      </div>

      <Field label="Notes (optional)"><textarea value={notes} maxLength={500} onChange={(event) => { clearErrors(); setNotes(event.target.value); }} className={`${selectClass} min-h-24 py-3`} placeholder="What are you looking for?" /></Field>
      {validation.form || error?.form ? <p role="alert" className="text-sm text-destructive">{validation.form || error?.form}</p> : null}
      <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Saving…" : initial ? "Save changes" : "Add card"}</Button></div>
    </form>
  );
}

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return <label className="block text-sm font-semibold"><span className="mb-2 block">{label}</span>{children}{error ? <span role="alert" className="mt-2 block font-normal text-destructive">{error}</span> : null}</label>;
}
