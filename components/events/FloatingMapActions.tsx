"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

export default function FloatingMapActions() {
  return (
    <div className="fixed bottom-[148px] left-5 z-40">
      <Link
        href="/create"
        aria-label="Host game"
        className="grid h-[52px] w-[52px] place-items-center rounded-full bg-[#6E5AA7] text-white shadow-[0_16px_48px_rgba(0,0,0,0.14)] backdrop-blur-xl transition hover:bg-[#5F4E94]"
      >
        <Plus size={20} />
      </Link>
    </div>
  );
}