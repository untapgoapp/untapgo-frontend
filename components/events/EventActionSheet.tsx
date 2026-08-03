"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type EventActionSheetProps = {
  open: boolean;
  title: string;
  description?: string | null;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
};

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export default function EventActionSheet({
  open,
  title,
  description,
  children,
  footer,
  onClose,
}: EventActionSheetProps) {
  const titleId = useId();
  const descriptionId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const focusTimer = window.requestAnimationFrame(() => {
      const focusable =
        sheetRef.current?.querySelectorAll<HTMLElement>(
          FOCUSABLE_SELECTOR,
        );

      focusable?.[0]?.focus();
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab" || !sheetRef.current) {
        return;
      }

      const focusable = Array.from(
        sheetRef.current.querySelectorAll<HTMLElement>(
          FOCUSABLE_SELECTOR,
        ),
      ).filter(
        (element) =>
          !element.hasAttribute("disabled") &&
          element.getAttribute("aria-hidden") !== "true",
      );

      if (focusable.length === 0) {
        event.preventDefault();
        sheetRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (
        event.shiftKey &&
        document.activeElement === first
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [open]);

  if (!mounted || !open) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[2147483000] isolate flex items-end justify-center bg-black/35 backdrop-blur-[2px] sm:items-center sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className="relative z-[1] flex max-h-[calc(100dvh-1rem)] w-full flex-col overflow-hidden rounded-t-surface bg-background shadow-overlay outline-none sm:max-h-[min(88dvh,760px)] sm:max-w-lg sm:rounded-surface"
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
      >
        <div className="relative border-b border-border/60 bg-surface/90 px-5 pb-4 pt-5 backdrop-blur-2xl">
          <div className="absolute left-1/2 top-2 h-1 w-9 -translate-x-1/2 rounded-full bg-[#6E5AA7]/25 sm:hidden" />

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2
                id={titleId}
                className="text-[19px] font-semibold tracking-[-0.02em] text-zinc-950"
              >
                {title}
              </h2>

              {description ? (
                <p
                  id={descriptionId}
                  className="mt-1 text-sm leading-5 text-zinc-500"
                >
                  {description}
                </p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label={`Close ${title}`}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-secondary text-secondary-foreground outline-none transition-colors hover:bg-primary/14 focus-visible:ring-[3px] focus-visible:ring-ring/20"
            >
              <X className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
          {children}
        </div>

        {footer ? (
          <div className="border-t border-border/60 bg-surface/90 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-2xl sm:px-5 sm:pb-4">
            {footer}
          </div>
        ) : (
          <div className="h-[env(safe-area-inset-bottom)] bg-surface/90 sm:hidden" />
        )}
      </div>
    </div>,
    document.body,
  );
}
