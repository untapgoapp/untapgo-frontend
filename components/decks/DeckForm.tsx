"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createDeck,
  getDeckCommanderName,
  getDeckExportText,
  getDeckFormatSlug,
  getDeckImageUrl,
  getDeckUrl,
  updateDeck,
  boolish,
  type Deck,
  type DeckPayload,
} from "@/services/decks";

const CARD_BACK =
  "https://upload.wikimedia.org/wikipedia/en/a/aa/Magic_the_gathering-card_back.jpg";

const FORMAT_OPTIONS = [
  { value: "", label: "None" },
  { value: "commander", label: "Commander" },
  { value: "cube", label: "Cube" },
  { value: "draft", label: "Draft" },
  { value: "legacy", label: "Legacy" },
  { value: "modern", label: "Modern" },
  { value: "pauper", label: "Pauper" },
  { value: "pioneer", label: "Pioneer" },
  { value: "premodern", label: "Premodern" },
  { value: "sealed", label: "Sealed" },
  { value: "standard", label: "Standard" },
  { value: "vintage", label: "Vintage" },
  { value: "other", label: "Other" },
];

const inputClass =
  "rounded-xl border border-zinc-300 bg-white px-4 py-3 text-black outline-none focus:border-black";

type DeckFormProps = {
  mode: "create" | "edit";
  initialDeck?: Deck | null;
};

export default function DeckForm({ mode, initialDeck }: DeckFormProps) {
  const router = useRouter();

  const [commanderName, setCommanderName] = useState(
    initialDeck ? getDeckCommanderName(initialDeck) : ""
  );

  const [deckUrl, setDeckUrl] = useState(
    initialDeck ? getDeckUrl(initialDeck) : ""
  );

  const [imageUrl, setImageUrl] = useState(
    initialDeck ? getDeckImageUrl(initialDeck) : ""
  );

  const [formatSlug, setFormatSlug] = useState(
    initialDeck ? getDeckFormatSlug(initialDeck) : ""
  );

  const [exportText, setExportText] = useState(
    initialDeck ? getDeckExportText(initialDeck) : ""
  );

  const [white, setWhite] = useState(
    initialDeck ? boolish(initialDeck.color_white) : false
  );
  const [blue, setBlue] = useState(
    initialDeck ? boolish(initialDeck.color_blue) : false
  );
  const [black, setBlack] = useState(
    initialDeck ? boolish(initialDeck.color_black) : false
  );
  const [red, setRed] = useState(
    initialDeck ? boolish(initialDeck.color_red) : false
  );
  const [green, setGreen] = useState(
    initialDeck ? boolish(initialDeck.color_green) : false
  );
  const [colorless, setColorless] = useState(
    initialDeck ? boolish(initialDeck.color_colorless) : false
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasAnyColor = white || blue || black || red || green;

  const finalColorless = colorless || !hasAnyColor;

  const previewImage = imageUrl.trim().startsWith("http")
    ? imageUrl.trim()
    : CARD_BACK;

  const previewName = commanderName.trim() || "Unnamed deck";

  const selectedColors = useMemo(() => {
    const colors: string[] = [];

    if (white) colors.push("W");
    if (blue) colors.push("U");
    if (black) colors.push("B");
    if (red) colors.push("R");
    if (green) colors.push("G");
    if (finalColorless) colors.push("C");

    return colors;
  }, [white, blue, black, red, green, finalColorless]);

  function buildPayload(): DeckPayload {
    return {
      commander_name: commanderName.trim(),
      deck_url: deckUrl.trim() || null,
      image_url: imageUrl.trim() || null,
      format_slug: formatSlug.trim() || null,
      export_text: exportText.trim() || null,

      color_white: white,
      color_blue: blue,
      color_black: black,
      color_red: red,
      color_green: green,
      color_colorless: finalColorless,
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!commanderName.trim()) {
      setError("Name is required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = buildPayload();

      if (mode === "edit") {
        if (!initialDeck?.id) throw new Error("Missing deck ID.");
        await updateDeck(initialDeck.id, payload);
      } else {
        await createDeck(payload);
      }

      router.push("/profile/decks");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save deck.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <section className="rounded-3xl bg-white/70 p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-20 w-24 overflow-hidden rounded-xl bg-zinc-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImage}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>

          <div className="min-w-0">
            <p className="truncate text-lg font-bold">{previewName}</p>

            {formatSlug ? (
              <p className="mt-1 text-sm capitalize text-zinc-500">
                {formatSlug}
              </p>
            ) : null}

            <div className="mt-2 flex gap-1">
              {selectedColors.map((color) => (
                <ManaDot key={color} value={color} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <InputField
        label="Name"
        value={commanderName}
        onChange={setCommanderName}
        required
      />

      <InputField
        label="Cover art URL"
        value={imageUrl}
        onChange={setImageUrl}
        placeholder="https://..."
      />

      <label className="grid gap-2">
        <span className="text-sm font-medium">Format</span>
        <select
          value={formatSlug}
          onChange={(event) => setFormatSlug(event.target.value)}
          className={inputClass}
        >
          {FORMAT_OPTIONS.map((option) => (
            <option key={option.value || "none"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <InputField
        label="Deck URL"
        value={deckUrl}
        onChange={setDeckUrl}
        placeholder="Moxfield, Archidekt, etc."
      />

      <section className="grid gap-3">
        <p className="text-sm font-medium">Colors</p>

        <div className="flex flex-wrap gap-3">
          <ColorToggle label="W" active={white} onClick={() => setWhite(!white)} />
          <ColorToggle label="U" active={blue} onClick={() => setBlue(!blue)} />
          <ColorToggle label="B" active={black} onClick={() => setBlack(!black)} />
          <ColorToggle label="R" active={red} onClick={() => setRed(!red)} />
          <ColorToggle label="G" active={green} onClick={() => setGreen(!green)} />
          <ColorToggle
            label="C"
            active={finalColorless}
            onClick={() => setColorless(!colorless)}
          />
        </div>

        {!hasAnyColor ? (
          <p className="text-xs text-zinc-500">
            No color selected, this deck will be saved as colorless.
          </p>
        ) : null}
      </section>

      <label className="grid gap-2">
        <span className="text-sm font-medium">Deck list</span>
        <textarea
          value={exportText}
          onChange={(event) => setExportText(event.target.value)}
          rows={12}
          placeholder="Paste your deck list here"
          className={inputClass}
        />
      </label>

      {error ? (
        <pre className="whitespace-pre-wrap rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </pre>
      ) : null}

      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-black px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save deck"}
      </button>
    </form>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className={inputClass}
      />
    </label>
  );
}

function ColorToggle({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex h-11 w-11 items-center justify-center rounded-full border text-sm font-bold transition",
        active
          ? "border-[#6E5AA7] bg-[#6E5AA7]/10 text-[#6E5AA7]"
          : "border-zinc-300 bg-white text-zinc-500",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function ManaDot({ value }: { value: string }) {
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold shadow-sm">
      {value}
    </span>
  );
}