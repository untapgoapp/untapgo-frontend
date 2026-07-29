import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#FBF7F1] px-6 py-10 text-black">
      <div className="mx-auto max-w-5xl">
        <nav className="flex items-center justify-between">
          <Link href="/" className="text-xl font-black tracking-tight">
            UntapGo
          </Link>

          <div className="flex items-center gap-4 text-sm font-medium">
            <Link href="/events">Events</Link>
            <Link href="/create">Create</Link>
            <Link href="/profile">Profile</Link>
            <Link
              href="/login"
              className="rounded-full bg-black px-4 py-2 text-white"
            >
              Log in
            </Link>
          </div>
        </nav>

        <section className="grid gap-10 py-20 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#6E5AA7]">
              Magic events, minus the chaos
            </p>

            <h1 className="mt-4 max-w-3xl text-5xl font-black tracking-tight md:text-6xl">
              Find a table. Host a game. Untap.
            </h1>

            <p className="mt-6 max-w-xl text-lg text-zinc-700">
              UntapGo helps Magic players and stores organize local games,
              manage join requests, and keep events simple.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/events"
                className="rounded-xl bg-black px-5 py-3 font-semibold text-white"
              >
                Browse events
              </Link>

              <Link
                href="/create"
                className="rounded-xl border border-zinc-300 bg-white px-5 py-3 font-semibold"
              >
                Create event
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="rounded-2xl bg-black p-5 text-white">
              <p className="text-sm text-zinc-400">Tonight</p>

              <h2 className="mt-2 text-2xl font-bold">Commander Night</h2>

              <div className="mt-6 grid gap-3 text-sm text-zinc-300">
                <div className="flex justify-between">
                  <span>Format</span>
                  <span className="text-white">Commander</span>
                </div>

                <div className="flex justify-between">
                  <span>Players</span>
                  <span className="text-white">3/4</span>
                </div>

                <div className="flex justify-between">
                  <span>Proxies</span>
                  <span className="text-white">Ask host</span>
                </div>
              </div>

              <div className="mt-6 rounded-xl bg-white px-4 py-3 text-center text-sm font-semibold text-black">
                Request to join
              </div>
            </div>

            <p className="mt-4 text-sm text-zinc-600">
              For players, hosts, and stores. No spreadsheet goblins required.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}