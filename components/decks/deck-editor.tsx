"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { deckRoutes } from "@/lib/deck-routes";
import {
  addCardToDeckText,
  type DeckTextSection,
} from "@/lib/deck-text";
import {
  ApiError,
  decksApi,
} from "@/lib/decks-api";
import type {
  Deck,
  DeckCardsResponse,
  DeckImportPreview,
  ScryfallCard,
} from "@/types/decks";

import { DeckCardInlineSearch } from "./deck-card-inline-search";
import { DeckImportPreviewPanel } from "./deck-import-preview";
import {
  ErrorNotice,
  FieldLabel,
  GhostButton,
  PageFrame,
  PrimaryButton,
  SecondaryButton,
  Surface,
  inputClassName,
} from "./deck-ui";

const FORMATS = [
  ["", "No format"],
  ["commander", "Commander"],
  ["standard", "Standard"],
  ["pioneer", "Pioneer"],
  ["modern", "Modern"],
  ["pauper", "Pauper"],
  ["legacy", "Legacy"],
  ["vintage", "Vintage"],
  ["premodern", "Premodern"],
  ["other", "Other"],
] as const;

function messageFromError(error: unknown): string {
  if (
    error instanceof ApiError ||
    error instanceof Error
  ) {
    return error.message;
  }

  return "Something went wrong";
}

export function DeckEditor({
  deck,
}: {
  deck?: Deck;
}) {
  const router = useRouter();

  const originalText =
    deck?.export_text?.trim() ?? "";

  const [name, setName] = useState(
    deck?.name ?? "",
  );

  const [format, setFormat] = useState(
    deck?.format_slug ?? "",
  );

  const [deckUrl, setDeckUrl] = useState(
    deck?.deck_url ?? "",
  );

  const [isPublic, setIsPublic] = useState(
    deck?.is_public ?? true,
  );

  const [text, setText] = useState(
    deck?.export_text ?? "",
  );

  const [preview, setPreview] =
    useState<DeckImportPreview | null>(null);

  const [existingCards, setExistingCards] =
    useState<DeckCardsResponse | null>(null);

  const [parsedText, setParsedText] =
    useState<string | null>(null);

  const [workingDeckId, setWorkingDeckId] =
    useState<string | null>(
      deck?.id ?? null,
    );

  const [processing, setProcessing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    if (
      !deck?.id ||
      !deck.unique_card_count
    ) {
      return;
    }

    let cancelled = false;

    void decksApi
      .cards(deck.id)
      .then((result) => {
        if (!cancelled) {
          setExistingCards(result);
        }
      })
      .catch(() => {
        // The deck text remains editable even
        // when the visual preview cannot load.
      });

    return () => {
      cancelled = true;
    };
  }, [
    deck?.id,
    deck?.unique_card_count,
  ]);

  const cleanText = text.trim();

  const listChanged =
    cleanText !== originalText;

  const isDirtySinceParse = Boolean(
    parsedText !== null &&
      parsedText !== cleanText,
  );

  const needsImport =
    !deck || listChanged;

  const canSave = Boolean(
    name.trim() &&
      !processing &&
      !saving &&
      (
        !needsImport ||
        (
          cleanText &&
          preview?.can_save &&
          !isDirtySinceParse
        )
      ),
  );

  const helperText = useMemo(() => {
    if (!cleanText) {
      return "Paste a list or search for cards above.";
    }

    if (!needsImport && !preview) {
      return "Saved card data is already available.";
    }

    if (!preview) {
      return "Submit the list before saving.";
    }

    if (isDirtySinceParse) {
      return "The list changed. Submit it again.";
    }

    if (!preview.can_save) {
      return "Fix the highlighted lines before saving.";
    }

    return "Ready to save.";
  }, [
    cleanText,
    isDirtySinceParse,
    needsImport,
    preview,
  ]);

  async function processList(): Promise<DeckImportPreview | null> {
    if (!cleanText) {
      setError(
        "Add at least one card first.",
      );

      return null;
    }

    setProcessing(true);
    setError(null);

    try {
      const result =
        await decksApi.parse(cleanText);

      const normalized =
        result.normalized_text.trim();

      setText(normalized);
      setPreview(result);
      setParsedText(normalized);

      return result;
    } catch (caught: unknown) {
      setError(
        messageFromError(caught),
      );

      return null;
    } finally {
      setProcessing(false);
    }
  }

  function addCard(
    card: ScryfallCard,
    quantity: number,
    section: DeckTextSection,
  ) {
    const next = addCardToDeckText(
      text,
      card.name,
      quantity,
      section,
      {
        setCode: card.set_code,
        collectorNumber:
          card.collector_number,
      },
    );

    setText(next);
    setPreview(null);
    setParsedText(null);
    setError(null);
  }

  async function saveDeck() {
    if (!name.trim()) {
      setError(
        "Deck name is required.",
      );

      return;
    }

    let validPreview = preview;

    if (
      needsImport &&
      (
        !validPreview ||
        isDirtySinceParse
      )
    ) {
      validPreview =
        await processList();
    }

    if (
      needsImport &&
      !validPreview?.can_save
    ) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let deckId = workingDeckId;

      if (!deckId) {
        const created =
          await decksApi.create({
            name: name.trim(),
            format_slug:
              format || null,
            deck_url:
              deckUrl.trim() || null,
            is_public: isPublic,
          });

        deckId = created.id;

        setWorkingDeckId(deckId);
      } else {
        await decksApi.update(
          deckId,
          {
            name: name.trim(),
            format_slug:
              format || null,
            deck_url:
              deckUrl.trim() || null,
            is_public: isPublic,
          },
        );
      }

      if (needsImport) {
        const imported =
          await decksApi.importText(
            deckId,
            (
              preview?.normalized_text ??
              text
            ).trim(),
          );

        router.push(
          deckRoutes.detail(
            imported.deck.id,
          ),
        );
      } else {
        router.push(
          deckRoutes.detail(deckId),
        );
      }

      router.refresh();
    } catch (caught: unknown) {
      setError(
        messageFromError(caught),
      );
    } finally {
      setSaving(false);
    }
  }

  const pageTitle = deck
    ? "Edit deck"
    : "New deck";

  return (
    <PageFrame>
      <div className="mb-6 lg:mb-8">
        <button
          type="button"
          onClick={() =>
            router.push(
              deckRoutes.list,
            )
          }
          className="text-sm font-semibold text-[#6E5AA7]"
        >
          ← My decks
        </button>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              {pageTitle}
            </h1>

            <p className="mt-2 text-sm leading-6 text-black/45">
              Paste a deck list or add
              cards directly from the
              catalogue.
            </p>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <SecondaryButton
              type="button"
              onClick={() =>
                router.back()
              }
            >
              Cancel
            </SecondaryButton>

            <PrimaryButton
              type="button"
              disabled={!canSave}
              onClick={() =>
                void saveDeck()
              }
            >
              {saving
                ? "Saving…"
                : deck
                  ? "Save changes"
                  : "Create deck"}
            </PrimaryButton>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mb-5">
          <ErrorNotice
            message={error}
          />
        </div>
      ) : null}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.12fr)_minmax(360px,0.88fr)]">
        <Surface className="p-4 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
            <label className="sm:col-span-2">
              <FieldLabel>
                Deck name
              </FieldLabel>

              <input
                className={
                  inputClassName
                }
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value,
                  )
                }
                placeholder="Golgari Food"
                maxLength={100}
              />
            </label>

            <label>
              <FieldLabel>
                Format
              </FieldLabel>

              <select
                className={
                  inputClassName
                }
                value={format}
                onChange={(event) =>
                  setFormat(
                    event.target.value,
                  )
                }
              >
                {FORMATS.map(
                  ([value, label]) => (
                    <option
                      key={
                        value ||
                        "none"
                      }
                      value={value}
                    >
                      {label}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label>
              <FieldLabel>
                Visibility
              </FieldLabel>

              <select
                className={
                  inputClassName
                }
                value={
                  isPublic
                    ? "public"
                    : "private"
                }
                onChange={(event) =>
                  setIsPublic(
                    event.target
                      .value ===
                      "public",
                  )
                }
              >
                <option value="public">
                  Public
                </option>

                <option value="private">
                  Private
                </option>
              </select>
            </label>

            <label className="sm:col-span-2">
              <FieldLabel>
                Original deck link ·
                optional
              </FieldLabel>

              <input
                className={
                  inputClassName
                }
                value={deckUrl}
                onChange={(event) =>
                  setDeckUrl(
                    event.target.value,
                  )
                }
                placeholder="Moxfield, ManaBox, Archidekt…"
                inputMode="url"
              />
            </label>
          </div>

          <div className="my-6 h-px bg-black/[0.06]" />

          <div className="flex items-end justify-between gap-4">
            <div>
              <FieldLabel>
                Deck list
              </FieldLabel>

              <p className="text-xs leading-5 text-black/40">
                Search for a card,
                choose its edition and
                add it to the list, or
                paste a complete deck
                below.
              </p>
            </div>

            {text ? (
              <GhostButton
                type="button"
                onClick={() => {
                  setText("");
                  setPreview(null);
                  setParsedText(null);
                  setError(null);
                }}
              >
                Clear
              </GhostButton>
            ) : null}
          </div>

          <DeckCardInlineSearch
            onAdd={addCard}
          />

          <textarea
            value={text}
            onChange={(event) => {
              setText(
                event.target.value,
              );
              setPreview(null);
              setParsedText(null);
            }}
            className={`${inputClassName} mt-4 min-h-[330px] resize-y py-4 font-mono text-[13px] leading-6 sm:min-h-[440px] xl:min-h-[520px]`}
            placeholder={
              "Deck\n4 Cauldron Familiar (ELD) 81\n4 Gilded Goose (ELD) 160\n4 Witch's Oven (ELD) 237\n\nSideboard\n4 Thoughtseize (2XM) 109"
            }
            spellCheck={false}
          />

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-medium text-black/40">
              {helperText}
            </p>

            <SecondaryButton
              type="button"
              disabled={
                processing ||
                !cleanText
              }
              onClick={() =>
                void processList()
              }
            >
              {processing
                ? "Submitting…"
                : "Submit"}
            </SecondaryButton>
          </div>
        </Surface>

        <div className="xl:sticky xl:top-24">
          <DeckImportPreviewPanel
            preview={preview}
            existingCards={existingCards}
            stale={listChanged && !preview}
            onPreviewChange={(nextPreview) => {
              setPreview(nextPreview);
              setText(nextPreview.normalized_text);
              setParsedText(nextPreview.normalized_text);
              setError(null);
            }}
          />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/[0.07] bg-white/88 px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 backdrop-blur-2xl md:hidden">
        <div className="mx-auto flex max-w-[1180px] gap-3">
          <SecondaryButton
            type="button"
            className="flex-1"
            onClick={() =>
              router.back()
            }
          >
            Cancel
          </SecondaryButton>

          <PrimaryButton
            type="button"
            className="flex-[1.35]"
            disabled={!canSave}
            onClick={() =>
              void saveDeck()
            }
          >
            {saving
              ? "Saving…"
              : deck
                ? "Save"
                : "Create deck"}
          </PrimaryButton>
        </div>
      </div>
    </PageFrame>
  );
}