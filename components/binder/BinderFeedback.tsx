import { Button } from "@/components/ui/button";

export function BinderError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-surface bg-destructive-subtle px-4 py-4 text-sm text-destructive">
      <p className="font-semibold">{message}</p>
      {onRetry ? <Button type="button" size="sm" variant="destructive" className="mt-3" onClick={onRetry}>Retry</Button> : null}
    </div>
  );
}

export function BinderEmpty({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-surface bg-surface-subtle px-5 py-10 text-center">
      <h2 className="font-bold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{detail}</p>
    </div>
  );
}

export function BinderLoading() {
  return (
    <div aria-label="Loading" className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="animate-pulse">
          <div className="aspect-[0.714] rounded-surface bg-muted" />
          <div className="mt-3 h-4 w-4/5 rounded bg-muted" />
          <div className="mt-2 h-3 w-3/5 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

export function LoadMore({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <div className="pt-7 text-center">
      <Button type="button" variant="outline" disabled={loading} onClick={onClick}>
        {loading ? "Loading…" : "Load more"}
      </Button>
    </div>
  );
}
