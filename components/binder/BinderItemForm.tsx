/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AVAILABILITY_LABELS,
  CARD_LANGUAGE_LABELS,
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
import type { CardLanguageVariant, ScryfallCard } from "@/types/decks";

import CardPrintingSelector from "./CardPrintingSelector";

const selectClass = "h-11 w-full rounded-control border border-input bg-surface px-3 text-sm outline-none focus:border-primary/45 focus:ring-[3px] focus:ring-ring/12";
const conditions = Object.keys(CONDITION_LABELS) as CardCondition[];
const availabilities = Object.keys(AVAILABILITY_LABELS) as BinderAvailability[];
const currencies: Currency[] = ["USD", "EUR", "GBP", "CAD", "AUD"];

function singleVariant(card: ScryfallCard): CardLanguageVariant {
  const language = card.lang?.toLowerCase() || "en";
  return {
    scryfall_card_id: card.id,
    language,
    language_label: CARD_LANGUAGE_LABELS[language] ?? language.toUpperCase(),
    printed_name: card.printed_name ?? null,
    image_url: null,
    finishes: card.finishes ?? [],
    card,
  };
}

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
  const [languageVariants, setLanguageVariants] = useState<CardLanguageVariant[]>([]);
  const [loadingLanguages, setLoadingLanguages] = useState(false);
  const [languageError, setLanguageError] = useState<string | null>(null);
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
  const languageSequence = useRef(0);

  async function loadLanguages(card: ScryfallCard) {
    const requestId = ++languageSequence.current;
    setLoadingLanguages(true);
    setLanguageError(null);
    try {
      const response = await decksApi.printingLanguages(card.id);
      if (requestId !== languageSequence.current) return;
      const variants = response.items.length ? response.items : [singleVariant(card)];
      setLanguageVariants(variants);
      const matching = variants.find((variant) => variant.scryfall_card_id === card.id)
        ?? variants.find((variant) => variant.language === (card.lang?.toLowerCase() || "en"))
        ?? variants[0];
      if (matching) {
        setSelectedCard(matching.card);
        setLanguage(matching.language);
      }
    } catch {
      if (requestId !== languageSequence.current) return;
      setLanguageVariants([singleVariant(card)]);
      setLanguage(card.lang?.toLowerCase() || "en");
      setLanguageError("Other printed languages could not be loaded right now.");
    } finally {
      if (requestId === languageSequence.current) setLoadingLanguages(false);
    }
  }

  useEffect(() => {
    if (!initial) return;
    let active = true;
    void decksApi.cardById(initial.scryfall_card_id).then((result) => {
      if (!active) return;
      setSelectedCard(result);
      void loadLanguages(result);
    }).catch(() => undefined);
    return () => {
      active = false;
      languageSequence.current += 1;
    };
  }, [initial]); // eslint-disable-line react-hooks/exhaustive-deps

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
    languageSequence.current += 1;
    setSelectedCard(selected);
    setLanguageVariants([]);
    setLanguageError(null);
    if (!selected) return;
    setLanguage(selected.lang?.toLowerCase() || "en");
    const supported = selected.finishes ?? [];
    setFinish(supported.includes("nonfoil") ? "nonfoil" : supported[0] ?? "nonfoil");
    void loadLanguages(selected);
  }

  function chooseLanguage(cardId: string) {
    clearErrors();
    const variant = languageVariants.find((item) => item.scryfall_card_id === cardId);
    if (!variant) return;
    setSelectedCard(variant.card);
    setLanguage(variant.language);
    const supported = variant.finishes;
    if (!supported.includes(finish)) {
      setFinish(supported.includes("nonfoil") ? "nonfoil" : supported[0] ?? "nonfoil");
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    clearErrors();
    if (!selectedCard) {
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
      scryfall_card_id: selectedCard.id,
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
          {(selectedCard?.image_uris?.normal || initial.image_url) ? <img src={selectedCard?.image_uris?.normal || initial.image_url || ""} alt="" className="w-14 rounded-md" /> : null}
          <div>
            <p className="font-semibold">{selectedCard?.printed_name || initial.printed_name || initial.card_name}</p>
            <p className="text-sm text-muted-foreground">{initial.set_code.toUpperCase()} · #{initial.collector_number}</p>
          </div>
        </div>
      ) : (
        <CardPrintingSelector value={selectedCard} onChange={selectCard} inputRef={searchInputRef} fieldError={validation.card ?? error?.card} />
      )}

      {selectedCard ? (
        <Field label="Printed language">
          <select
            value={selectedCard.id}
            onChange={(event) => chooseLanguage(event.target.value)}
            className={selectClass}
            disabled={loadingLanguages || languageVariants.length <= 1}
            aria-describedby={languageError ? "binder-language-error" : undefined}
          >
            {(languageVariants.length ? languageVariants : [singleVariant(selectedCard)]).map((variant) => (
              <option key={variant.scryfall_card_id} value={variant.scryfall_card_id}>
                {variant.language_label}{variant.printed_name ? ` · ${variant.printed_name}` : ""}
              </option>
            ))}
          </select>
          {loadingLanguages ? <span className="mt-2 block font-normal text-muted-foreground">Loading available printed languages…</span> : null}
          {languageError ? <span id="binder-language-error" className="mt-2 block font-normal text-muted-foreground">{languageError}</span> : null}
        </Field>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Finish" error={validation.finish ?? error?.finish}>
          <select ref={finishInputRef} value={finish} onChange={(event) => { clearErrors(); setFinish(event.target.value as CardFinish); }} className={selectClass} disabled={!finishes.length} aria-invalid={Boolean(validation.finish ?? error?.finish)}>
            {finishes.map((value) => <option key={value} value={value}>{FINISH_LABELS[value]}</option>)}
          </select>
        </Field>
        <Field label="Condition">
          <select value={condition} onChange={(event) => { clearErrors(); setCondition(event.target.value as CardCondition); }} className={selectClass}>
            {conditions.map((value) => <option key={value} value={value}>{CONDITION_LABELS[value]}</option>)}
          </select>
        </Field>
        <Field label="Quantity" error={validation.quantity ?? error?.quantity}>
          <Input type="number" min={1} max={999} value={quantity} onChange={(event) => { clearErrors(); setQuantity(Number(event.target.value)); }} aria-invalid={Boolean(validation.quantity ?? error?.quantity)} />
        </Field>
        <Field label="Available for" error={validation.availability ?? error?.availability}>
          <select value={availability} onChange={(event) => { clearErrors(); setAvailability(event.target.value as BinderAvailability); }} className={selectClass} aria-invalid={Boolean(validation.availability ?? error?.availability)}>
            {availabilities.map((value) => <option key={value} value={value}>{AVAILABILITY_LABELS[value]}</option>)}
          </select>
        </Field>
        <Field label="Asking price (optional)" error={validation.price ?? error?.price}>
          <div className="grid grid-cols-[1fr_5.5rem] gap-2">
            <Input ref={priceInputRef} type="number" min="0.01" max="9999999999.99" step="0.01" value={price} onChange={(event) => { clearErrors(); setPrice(event.target.value); }} onBlur={() => setPrice((current) => formatAskingPriceInput(current))} placeholder="0.00" aria-invalid={Boolean(validation.price ?? error?.price)} />
            <select value={price.trim() ? currency : ""} onChange={(event) => { clearErrors(); setCurrency(event.target.value as Currency); }} className={selectClass} disabled={!price.trim()} aria-label="Asking price currency">
              <option value="" disabled>Currency</option>
              {currencies.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>
        </Field>
      </div>

      <Field label="Notes (optional)">
        <textarea value={notes} maxLength={500} onChange={(event) => { clearErrors(); setNotes(event.target.value); }} className={`${selectClass} min-h-24 py-3`} placeholder="What are you looking for?" />
      </Field>
      {validation.form || error?.form ? <p role="alert" className="text-sm text-destructive">{validation.form || error?.form}</p> : null}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? "Saving…" : initial ? "Save changes" : "Add card"}</Button>
      </div>
    </form>
  );
}

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return <label className="block text-sm font-semibold"><span className="mb-2 block">{label}</span>{children}{error ? <span role="alert" className="mt-2 block font-normal text-destructive">{error}</span> : null}</label>;
}
