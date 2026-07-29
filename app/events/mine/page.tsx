import MyEventsBrowser from "@/components/events/MyEventsBrowser";

export default function MyEventsPage() {
  return (
    <main className="min-h-screen bg-[#FBF7F1] px-6 py-10 text-black">
      <div className="mx-auto max-w-5xl">
        <MyEventsBrowser />
      </div>
    </main>
  );
}