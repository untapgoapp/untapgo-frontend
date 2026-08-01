export default function ProfileLoadingState() {
  return (
    <main className="min-h-screen px-4 py-5 sm:px-5 sm:py-7 lg:px-0 lg:py-8">
      <div className="w-full max-w-[1050px] animate-pulse" aria-label="Loading profile" role="status">
        <div className="rounded-surface bg-surface/70 p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="h-24 w-24 rounded-full bg-secondary sm:h-28 sm:w-28" />
            <div className="flex-1 py-1">
              <div className="h-3 w-28 rounded bg-[#6E5AA7]/15" />
              <div className="mt-3 h-7 w-52 rounded bg-black/10" />
              <div className="mt-3 h-4 w-full max-w-md rounded bg-black/[0.07]" />
              <div className="mt-2 h-4 w-2/3 max-w-sm rounded bg-black/[0.06]" />
            </div>
          </div>
        </div>
        <div className="mt-4 h-11 rounded-control bg-surface-subtle" />
        {[1, 2, 3].map((section) => (
          <div key={section} className="py-6">
            <div className="h-5 w-28 rounded bg-black/10" />
            <div className="mt-4 h-16 rounded-surface bg-surface/55" />
          </div>
        ))}
        <span className="sr-only">Loading profile</span>
      </div>
    </main>
  );
}
