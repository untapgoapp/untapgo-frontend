"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BellRing,
  Info,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";

import PushPermissionButton from "@/components/notifications/PushPermissionButton";
import {
  supabase,
} from "@/lib/supabase/client";

export default function NotificationSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function checkAuthentication() {
      const { data, error } = await supabase.auth.getUser();

      if (!active) {
        return;
      }

      if (error || !data.user) {
        router.replace("/login?next=%2Fsettings%2Fnotifications");
        return;
      }

      setLoading(false);
    }

    void checkAuthentication();

    return () => {
      active = false;
    };
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8F5EF] px-5 py-12 text-black">
        <div className="mx-auto max-w-2xl">
          <p className="text-sm text-zinc-500">
            Loading notification settings...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F5EF] px-5 py-12 text-black">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#6E5AA7]"
        >
          <ArrowLeft size={16} />
          Back to settings
        </Link>

        <header className="mt-8 border-b border-black/10 pb-7">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-[#EEE9FF] text-[#6E5AA7]">
              <BellRing size={20} />
            </div>

            <div>
              <p className="text-sm font-semibold text-[#6E5AA7]">
                Settings
              </p>

              <h1 className="text-3xl font-black tracking-tight">
                Notifications
              </h1>
            </div>
          </div>

          <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-600">
            Control system notifications for this browser and device.
          </p>
        </header>

        <section className="mt-7">
          <PushPermissionButton variant="settings" />
        </section>

        <section className="mt-6 rounded-2xl bg-black/[0.04] p-4">
          <div className="flex gap-3">
            <Info
              size={18}
              className="mt-0.5 shrink-0 text-[#6E5AA7]"
            />

            <p className="text-sm leading-6 text-zinc-600">
              This setting only affects the current browser and device.
              Notifications inside UntapGo remain available from the regular
              bell.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}