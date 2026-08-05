"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

type HistoryBackLinkProps = Omit<ComponentPropsWithoutRef<"button">, "children" | "onClick"> & {
  fallbackHref: string;
};

export default function HistoryBackLink({
  fallbackHref,
  className,
  ...props
}: HistoryBackLinkProps) {
  const router = useRouter();

  function goBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className={cn(
        "inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/15",
        className,
      )}
      {...props}
    >
      <ArrowLeft size={15} aria-hidden="true" />
      Back
    </button>
  );
}
