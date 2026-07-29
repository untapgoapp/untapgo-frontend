export type DeckTextSection =
  | "mainboard"
  | "sideboard"
  | "commander";

export type DeckTextPrinting = {
  setCode?: string | null;
  collectorNumber?: string | null;
};

type ParsedCardLine = {
  quantity: number;
  name: string;
  setCode?: string | null;
  collectorNumber?: string | null;
};

const PRINTING_RE =
  /^(.+?)\s+\(([A-Za-z0-9]+)\)\s+([A-Za-z0-9★☆-]+)$/;

function headingFor(section: DeckTextSection): string {
  if (section === "sideboard") return "Sideboard";
  if (section === "commander") return "Commander";
  return "Deck";
}

function headingSection(
  line: string,
): DeckTextSection | null {
  const value = line
    .trim()
    .toLowerCase()
    .replace(/:$/, "");

  if (
    value === "deck" ||
    value === "mainboard" ||
    value === "main deck"
  ) {
    return "mainboard";
  }

  if (value === "sideboard") {
    return "sideboard";
  }

  if (
    value === "commander" ||
    value === "commanders"
  ) {
    return "commander";
  }

  return null;
}

function parsePrinting(
  value: string,
): {
  name: string;
  setCode?: string | null;
  collectorNumber?: string | null;
} {
  const match = value.trim().match(PRINTING_RE);

  if (!match) {
    return {
      name: value.trim(),
      setCode: null,
      collectorNumber: null,
    };
  }

  return {
    name: match[1].trim(),
    setCode: match[2].trim().toLowerCase(),
    collectorNumber: match[3].trim(),
  };
}

function cardLine(
  line: string,
): ParsedCardLine | null {
  const match = line
    .trim()
    .match(/^(\d+)\s*x?\s+(.+?)\s*$/i);

  if (!match) return null;

  const printing = parsePrinting(match[2]);

  return {
    quantity: Number(match[1]),
    ...printing,
  };
}

function normalizedValue(
  value?: string | null,
): string {
  return (value ?? "").trim().toLowerCase();
}

function samePrinting(
  parsed: ParsedCardLine,
  cardName: string,
  printing?: DeckTextPrinting,
): boolean {
  const sameName =
    parsed.name.localeCompare(cardName, undefined, {
      sensitivity: "base",
    }) === 0;

  if (!sameName) return false;

  return (
    normalizedValue(parsed.setCode) ===
      normalizedValue(printing?.setCode) &&
    normalizedValue(parsed.collectorNumber) ===
      normalizedValue(printing?.collectorNumber)
  );
}

function cardDescriptor(
  cardName: string,
  printing?: DeckTextPrinting,
): string {
  const setCode = printing?.setCode?.trim();
  const collectorNumber =
    printing?.collectorNumber?.trim();

  if (setCode && collectorNumber) {
    return `${cardName} (${setCode.toUpperCase()}) ${collectorNumber}`;
  }

  if (setCode) {
    return `${cardName} (${setCode.toUpperCase()})`;
  }

  return cardName;
}

export function addCardToDeckText(
  source: string,
  cardName: string,
  quantity: number,
  targetSection: DeckTextSection,
  printing?: DeckTextPrinting,
): string {
  const safeQuantity = Math.max(
    1,
    Math.min(99, Math.floor(quantity)),
  );

  const lines = source
    .replace(/\r\n/g, "\n")
    .split("\n");

  let section: DeckTextSection = "mainboard";
  let foundTargetHeading = false;

  for (
    let index = 0;
    index < lines.length;
    index += 1
  ) {
    const detected = headingSection(lines[index]);

    if (detected) {
      section = detected;

      if (detected === targetSection) {
        foundTargetHeading = true;
      }

      continue;
    }

    const parsed = cardLine(lines[index]);

    if (
      section === targetSection &&
      parsed &&
      samePrinting(
        parsed,
        cardName,
        printing,
      )
    ) {
      lines[index] = `${parsed.quantity + safeQuantity} ${cardDescriptor(
        parsed.name,
        {
          setCode: parsed.setCode,
          collectorNumber:
            parsed.collectorNumber,
        },
      )}`;

      return lines.join("\n").trim();
    }
  }

  const newLine = `${safeQuantity} ${cardDescriptor(
    cardName,
    printing,
  )}`;

  if (targetSection === "mainboard") {
    const nextSection = lines.findIndex(
      (line) => {
        const value = headingSection(line);

        return (
          value === "sideboard" ||
          value === "commander"
        );
      },
    );

    const hasDeckHeading = lines.some(
      (line) =>
        headingSection(line) === "mainboard",
    );

    if (!hasDeckHeading) {
      lines.unshift("Deck");
    }

    const insertAt =
      nextSection >= 0
        ? nextSection
        : lines.length;

    const prefixBlank =
      insertAt > 0 &&
      lines[insertAt - 1]?.trim()
        ? [""]
        : [];

    lines.splice(
      insertAt,
      0,
      ...prefixBlank,
      newLine,
    );

    return lines
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  if (foundTargetHeading) {
    let active: DeckTextSection =
      "mainboard";

    let insertAt = lines.length;

    for (
      let index = 0;
      index < lines.length;
      index += 1
    ) {
      const detected =
        headingSection(lines[index]);

      if (!detected) continue;

      if (
        active === targetSection &&
        detected !== targetSection
      ) {
        insertAt = index;
        break;
      }

      active = detected;
    }

    lines.splice(insertAt, 0, newLine);

    return lines
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  const cleaned = lines.join("\n").trim();

  return `${cleaned}${cleaned ? "\n\n" : ""}${headingFor(
    targetSection,
  )}\n${newLine}`;
}