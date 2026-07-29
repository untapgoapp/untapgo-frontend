"use client";

import {
  ArrowLeft,
  Check,
  LoaderCircle,
  Ruler,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase/client";
import {
  getMyDisplayPreferences,
  updateMyDisplayPreferences,
  type DistanceUnit,
} from "@/services/profiles";


const OPTIONS: Array<{
  value: DistanceUnit;
  title: string;
  example: string;
}> = [
  {
    value: "km",
    title: "Kilometres",
    example: "8.4 km away",
  },
  {
    value: "mi",
    title: "Miles",
    example: "5.2 mi away",
  },
];


export default function DisplaySettingsPage() {
  const router = useRouter();

  const [distanceUnit, setDistanceUnit] =
    useState<DistanceUnit>("km");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] =
    useState<DistanceUnit | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data, error: authError } =
        await supabase.auth.getUser();

      if (!active) {
        return;
      }

      if (authError || !data.user) {
        router.replace(
          "/login?next=%2Fsettings%2Fdisplay",
        );
        return;
      }

      try {
        const preferences =
          await getMyDisplayPreferences();

        if (active) {
          setDistanceUnit(
            preferences.distance_unit,
          );
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load display settings.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [router]);

  async function chooseDistanceUnit(
    nextUnit: DistanceUnit,
  ) {
    if (
      loading ||
      saving ||
      nextUnit === distanceUnit
    ) {
      return;
    }

    const previousUnit = distanceUnit;

    setDistanceUnit(nextUnit);
    setSaving(nextUnit);
    setSaved(false);
    setError(null);

    try {
      const result =
        await updateMyDisplayPreferences({
          distance_unit: nextUnit,
        });

      setDistanceUnit(result.distance_unit);
      setSaved(true);

      window.setTimeout(() => {
        setSaved(false);
      }, 1600);
    } catch (saveError) {
      setDistanceUnit(previousUnit);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save display settings.",
      );
    } finally {
      setSaving(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#F8F5EF] px-5 py-12 text-black">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 transition hover:text-black"
        >
          <ArrowLeft size={16} />
          Settings
        </Link>

        <header className="mb-9 mt-7">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6E5AA7]">
            Preferences
          </p>

          <h1 className="mt-2 text-4xl font-black tracking-tight">
            Display
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600">
            Choose how UntapGo shows event distances and search ranges.
          </p>
        </header>

        <section className="overflow-hidden rounded-2xl border border-black/10 bg-white/65">
          <div className="flex items-center gap-3 border-b border-black/10 px-5 py-4">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#6E5AA7]/10 text-[#6E5AA7]">
              <Ruler size={18} />
            </span>

            <div>
              <h2 className="font-bold">
                Distance units
              </h2>
              <p className="mt-0.5 text-sm text-zinc-500">
                Applied everywhere distances appear
              </p>
            </div>
          </div>

          <div className="divide-y divide-black/10">
            {OPTIONS.map((option) => {
              const selected =
                distanceUnit === option.value;
              const optionSaving =
                saving === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    void chooseDistanceUnit(
                      option.value,
                    );
                  }}
                  disabled={loading || saving !== null}
                  className="flex w-full items-center gap-4 px-5 py-5 text-left transition hover:bg-black/[0.025] disabled:cursor-wait disabled:opacity-70"
                >
                  <span
                    className={[
                      "grid h-5 w-5 shrink-0 place-items-center rounded-full border",
                      selected
                        ? "border-[#6E5AA7] bg-[#6E5AA7] text-white"
                        : "border-black/20 bg-white",
                    ].join(" ")}
                  >
                    {optionSaving ? (
                      <LoaderCircle
                        size={13}
                        className="animate-spin"
                      />
                    ) : selected ? (
                      <Check size={13} strokeWidth={3} />
                    ) : null}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">
                      {option.title}
                    </span>
                    <span className="mt-0.5 block text-sm text-zinc-500">
                      {option.example}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="mt-4 min-h-6">
          {saved ? (
            <p className="text-sm font-semibold text-emerald-700">
              Saved
            </p>
          ) : null}

          {error ? (
            <p className="text-sm text-red-700">
              {error}
            </p>
          ) : null}
        </div>

        <p className="mt-4 text-sm leading-6 text-zinc-500">
          UntapGo keeps geographic calculations in kilometres internally.
          This setting only converts the values shown to you.
        </p>
      </div>
    </main>
  );
}
