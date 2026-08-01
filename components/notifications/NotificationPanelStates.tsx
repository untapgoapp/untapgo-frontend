import { BellOff } from "lucide-react";

export function NotificationPanelLoading() {
  return <div className="grid gap-1 py-2"><LoadingRow /><LoadingRow /><LoadingRow /></div>;
}

function LoadingRow() {
  return (
    <div className="flex items-start gap-3 px-4 py-3.5">
      <div className="h-10 w-10 animate-pulse rounded-full bg-black/10" />
      <div className="flex-1">
        <div className="h-3.5 w-32 animate-pulse rounded-full bg-black/10" />
        <div className="mt-2 h-3 w-full animate-pulse rounded-full bg-black/[0.06]" />
        <div className="mt-2 h-2.5 w-16 animate-pulse rounded-full bg-black/[0.05]" />
      </div>
    </div>
  );
}

export function NotificationPanelEmpty() {
  return (
    <div className="grid place-items-center px-6 py-12 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-black/[0.045] text-zinc-400"><BellOff className="h-5 w-5" /></div>
      <p className="mt-4 text-sm font-semibold text-zinc-800">Nothing new</p>
      <p className="mt-1 max-w-56 text-sm leading-6 text-zinc-500">New event activity will appear here.</p>
    </div>
  );
}
