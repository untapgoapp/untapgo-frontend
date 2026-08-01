"use client";

import {
  Check,
  Copy,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";

type CopyArenaTagProps = {
  arenaTag?: string | null;
  className?: string;
};

async function copyToClipboard(
  value: string,
): Promise<void> {
  if (
    typeof navigator !==
      "undefined" &&
    navigator.clipboard &&
    window.isSecureContext
  ) {
    await navigator.clipboard.writeText(
      value,
    );

    return;
  }

  const textarea =
    document.createElement(
      "textarea",
    );

  textarea.value = value;
  textarea.readOnly = true;

  textarea.style.position =
    "fixed";
  textarea.style.left =
    "-9999px";
  textarea.style.top =
    "0";
  textarea.style.opacity =
    "0";

  document.body.appendChild(
    textarea,
  );

  textarea.focus();
  textarea.select();

  const copied =
    document.execCommand(
      "copy",
    );

  document.body.removeChild(
    textarea,
  );

  if (!copied) {
    throw new Error(
      "Could not copy MTG Arena tag.",
    );
  }
}

export default function CopyArenaTag({
  arenaTag,
  className = "",
}: CopyArenaTagProps) {
  const [copied, setCopied] =
    useState(false);

  const [copyError, setCopyError] =
    useState(false);

  const timeoutRef =
    useRef<ReturnType<
      typeof setTimeout
    > | null>(null);

  const value =
    arenaTag?.trim() || "";

  useEffect(() => {
    return () => {
      if (
        timeoutRef.current
      ) {
        clearTimeout(
          timeoutRef.current,
        );
      }
    };
  }, []);

  if (!value) {
    return null;
  }

  async function handleCopy(
    event: MouseEvent<HTMLButtonElement>,
  ) {
    event.preventDefault();
    event.stopPropagation();

    setCopyError(false);

    try {
      await copyToClipboard(
        value,
      );

      setCopied(true);

      if (
        timeoutRef.current
      ) {
        clearTimeout(
          timeoutRef.current,
        );
      }

      timeoutRef.current =
        setTimeout(() => {
          setCopied(false);
        }, 1800);
    } catch {
      setCopied(false);
      setCopyError(true);
    }
  }

  const title = copyError
    ? "Could not copy MTG Arena tag"
    : copied
      ? "Copied to clipboard"
      : "Copy MTG Arena tag";

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={title}
      aria-label={`Copy MTG Arena tag ${value}`}
      className={[
        "inline-flex min-h-9 max-w-full items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold transition",
        copied
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : copyError
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-black/10 bg-white/80 text-zinc-700 hover:border-[#6E5AA7]/40 hover:bg-[#F3EFFF] hover:text-[#6E5AA7]",
        className,
      ].join(" ")}
    >
      {copied ? (
        <Check
          size={14}
          className="shrink-0"
          aria-hidden="true"
        />
      ) : (
        <Copy
          size={14}
          className="shrink-0"
          aria-hidden="true"
        />
      )}

      <span className="truncate">
        {value}
      </span>

      <span
        aria-live="polite"
        className="shrink-0 text-xs font-medium"
      >
        {copied
          ? "Copied"
          : copyError
            ? "Try again"
            : ""}
      </span>
    </button>
  );
}
