"use client";

import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactNode,
} from "react";

import { ManaIdentity } from "@/components/magic/mana-symbols";

export function PageFrame({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-[calc(100vh-64px)] overflow-x-hidden bg-[#F7F4EE] px-4 pb-[calc(96px+env(safe-area-inset-bottom))] pt-6 text-[#17171A] sm:px-6 sm:pt-8 md:pb-12 lg:px-8 lg:pt-10">
      <div className="mx-auto w-full max-w-[1180px]">{children}</div>
    </main>
  );
}

export function Surface({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-[22px] border border-black/[0.055] bg-white shadow-[0_10px_30px_rgba(31,24,18,0.045)] sm:rounded-[26px] ${className}`}
      {...props}
    />
  );
}

export function PrimaryButton({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#111113] px-5 text-sm font-semibold text-white transition hover:bg-black/80 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
      {...props}
    />
  );
}

export function SecondaryButton({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-black/[0.085] bg-white px-5 text-sm font-semibold text-[#242428] transition hover:bg-black/[0.025] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
      {...props}
    />
  );
}

export function GhostButton({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-3.5 text-sm font-semibold text-[#6E5AA7] transition hover:bg-[#6E5AA7]/[0.08] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
      {...props}
    />
  );
}

export function IconButton({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/[0.075] bg-white text-black/55 transition hover:bg-black/[0.03] active:scale-[0.97] disabled:opacity-40 ${className}`}
      {...props}
    />
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="mb-2 block text-[13px] font-semibold text-black/65">
      {children}
    </span>
  );
}

export const inputClassName =
  "min-h-12 w-full rounded-2xl border border-black/[0.08] bg-white px-4 text-[15px] text-[#17171A] outline-none transition placeholder:text-black/32 focus:border-[#6E5AA7]/50 focus:ring-4 focus:ring-[#6E5AA7]/[0.09]";

export function ErrorNotice({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-[#D04A4A]/15 bg-[#D04A4A]/[0.065] px-4 py-3 text-sm text-[#963838]">
      {message}
    </div>
  );
}

export function EmptyArtwork({ label }: { label?: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_20%_10%,#E7DFF3,transparent_42%),linear-gradient(145deg,#F8F6FB,#ECE8F4)] px-5 text-center text-sm font-medium text-[#675D7E]">
      {label ?? "No cover selected"}
    </div>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-14 text-sm text-black/50">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-black/10 border-t-[#6E5AA7]" />
      {label}
    </div>
  );
}

export function ManaPills({ colors }: { colors: string[] }) {
  return <ManaIdentity colors={colors} size="md" />;
}


export function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6 6 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M12 5v14M5 12h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="m16 16 4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <circle cx="5" cy="12" r="1.5" fill="currentColor" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <circle cx="19" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path d="M8 8v10m4-10v10m4-10v10M5 6h14M9 6l1-2h4l1 2m2 0-1 15H8L7 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="m9 6 6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
