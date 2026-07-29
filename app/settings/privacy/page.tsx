"use client";

import {
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Library,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import {
  useRouter,
} from "next/navigation";

import {
  supabase,
} from "@/lib/supabase/client";
import {
  getMyProfilePrivacy,
  updateMyProfilePrivacy,
  type ProfilePrivacySettings,
} from "@/services/profiles";

const DEFAULT_SETTINGS: ProfilePrivacySettings = {
  show_bio: true,
  show_mtg_arena_username: true,
  show_stats: true,
  show_public_decks: true,
};

export default function SettingsPrivacyPage() {
  const router = useRouter();

  const [settings, setSettings] =
    useState<ProfilePrivacySettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      setLoading(true);
      setError(null);

      try {
        const {
          data,
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          throw authError;
        }

        if (!data.user) {
          router.replace("/login?next=%2Fsettings%2Fprivacy");
          return;
        }

        const loadedSettings = await getMyProfilePrivacy();

        if (!active) {
          return;
        }

        setSettings(loadedSettings);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load privacy settings.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadSettings();

    return () => {
      active = false;
    };
  }, [router]);

  function changeSetting(
    key: keyof ProfilePrivacySettings,
    value: boolean,
  ) {
    setSaved(false);

    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function saveSettings() {
    if (saving) {
      return;
    }

    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const updated = await updateMyProfilePrivacy(settings);

      setSettings(updated);
      setSaved(true);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save privacy settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FBF7F1] px-6 py-10 text-black">
        <div className="mx-auto max-w-2xl">
          <p className="text-sm text-zinc-500">
            Loading privacy settings...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FBF7F1] px-6 py-10 text-black">
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
              <ShieldCheck size={20} />
            </div>

            <div>
              <p className="text-sm font-semibold text-[#6E5AA7]">
                Settings
              </p>

              <h1 className="text-3xl font-black tracking-tight">
                Profile privacy
              </h1>
            </div>
          </div>

          <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-600">
            Choose what other players can see. Your nickname and avatar remain
            public so event participants can identify each other.
          </p>
        </header>

        <section className="mt-7 overflow-hidden rounded-3xl border border-black/10 bg-white">
          <PrivacyToggle
            title="Bio"
            description="Show your profile bio to other players."
            checked={settings.show_bio}
            onChange={(value) => {
              changeSetting("show_bio", value);
            }}
          />

          <PrivacyToggle
            title="MTG Arena tag"
            description="Let other players view and copy your Arena username."
            checked={settings.show_mtg_arena_username}
            onChange={(value) => {
              changeSetting("show_mtg_arena_username", value);
            }}
          />

          <PrivacyToggle
            title="Hosted and played stats"
            description="Show the number of events you have hosted and played."
            checked={settings.show_stats}
            onChange={(value) => {
              changeSetting("show_stats", value);
            }}
          />

          <PrivacyToggle
            title="Public decks"
            description="Allow decks individually marked public to appear on your public profile."
            checked={settings.show_public_decks}
            onChange={(value) => {
              changeSetting("show_public_decks", value);
            }}
          />
        </section>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/profile/decks"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-black/10 bg-white px-4 text-sm font-semibold text-zinc-700"
          >
            <Library size={16} />
            Manage individual decks
          </Link>

          <button
            type="button"
            onClick={() => {
              void saveSettings();
            }}
            disabled={saving}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-black px-5 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60"
          >
            {saving ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : null}

            {saving ? "Saving..." : "Save privacy"}
          </button>
        </div>

        {saved ? (
          <p className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            Privacy settings saved.
          </p>
        ) : null}

        {error ? (
          <pre className="mt-5 whitespace-pre-wrap rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </pre>
        ) : null}

        <section className="mt-8 rounded-2xl bg-black/[0.04] p-4">
          <div className="flex gap-3">
            {settings.show_bio &&
            settings.show_mtg_arena_username &&
            settings.show_stats &&
            settings.show_public_decks ? (
              <Eye
                size={18}
                className="mt-0.5 shrink-0 text-[#6E5AA7]"
              />
            ) : (
              <EyeOff
                size={18}
                className="mt-0.5 shrink-0 text-[#6E5AA7]"
              />
            )}

            <p className="text-sm leading-6 text-zinc-600">
              These controls are enforced by the backend before profile data is
              returned.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function PrivacyToggle({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-4 border-b border-black/10 px-5 py-5 last:border-b-0">
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-zinc-950">
          {title}
        </span>

        <span className="mt-1 block text-sm leading-5 text-zinc-500">
          {description}
        </span>
      </span>

      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => {
          onChange(event.target.checked);
        }}
        className="peer sr-only"
      />

      <span className="relative h-7 w-12 shrink-0 rounded-full bg-zinc-200 transition peer-checked:bg-[#6E5AA7] peer-focus-visible:ring-4 peer-focus-visible:ring-[#6E5AA7]/20">
        <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}