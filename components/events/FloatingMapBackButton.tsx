"use client";

import { ArrowLeft } from "lucide-react";

type FloatingMapBackButtonProps = {
  onClick: () => void;
};

export default function FloatingMapBackButton({
  onClick,
}: FloatingMapBackButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Back to list"
      className="fixed left-5 top-5 z-40 grid h-[52px] w-[52px] place-items-center rounded-full border border-black/10 bg-white/[0.92] text-black shadow-[0_16px_48px_rgba(0,0,0,0.12)] backdrop-blur-xl transition hover:bg-white"
    >
      <ArrowLeft size={20} />
    </button>
  );
}