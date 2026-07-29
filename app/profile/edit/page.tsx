"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  useRouter,
} from "next/navigation";

import {
  supabase,
} from "@/lib/supabase/client";
import {
  getProfileArenaUsername,
  getProfileAvatarUrl,
  getProfileNickname,
  getPublicProfile,
  updateMyProfile,
  type PublicProfile,
} from "@/services/profiles";

const AVATAR_BUCKET = "avatars";

function getFileExtension(file: File) {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

export default function EditProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [arenaUsername, setArenaUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [pendingAvatar, setPendingAvatar] = useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewUrl = useMemo(() => {
    if (pendingAvatar) return URL.createObjectURL(pendingAvatar);
    return avatarUrl;
  }, [pendingAvatar, avatarUrl]);

  useEffect(() => {
    async function loadProfile() {
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
          router.push("/login");
          return;
        }

        setUserId(data.user.id);

        const loadedProfile = await getPublicProfile(data.user.id);

        setProfile(loadedProfile);
        setNickname(getProfileNickname(loadedProfile));
        setBio(loadedProfile.bio || "");
        setArenaUsername(getProfileArenaUsername(loadedProfile) || "");
        setAvatarUrl(getProfileAvatarUrl(loadedProfile));
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load profile.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadProfile();
  }, [router]);

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    setPendingAvatar(file);
    setError(null);
  }

  async function uploadAvatar(file: File) {
    if (!userId) throw new Error("AUTH_REQUIRED");

    const extension = getFileExtension(file);
    const path = `${userId}/avatar.${extension}`;

    const {
      error: uploadError,
    } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, file, {
        upsert: true,
        contentType: file.type || "image/jpeg",
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(path);

    return `${data.publicUrl}?v=${Date.now()}`;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanNickname = nickname.trim();

    if (!cleanNickname) {
      setError("Nickname is required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let nextAvatarUrl = avatarUrl;

      if (pendingAvatar) {
        nextAvatarUrl = await uploadAvatar(pendingAvatar);
      }

      await updateMyProfile({
        nickname: cleanNickname,
        avatar_url: nextAvatarUrl,
        bio,
        mtg_arena_username: arenaUsername,
      });

      router.push("/profile");
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save profile.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FBF7F1] px-6 py-10 text-black">
        <div className="mx-auto max-w-2xl">
          <p>Loading profile...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FBF7F1] px-6 py-10 text-black">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/profile"
          className="text-sm font-medium text-[#6E5AA7]"
        >
          ← Back to profile
        </Link>

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-3xl font-black">
              Edit profile
            </h1>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>

          <div className="mt-8 grid justify-items-center gap-4">
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-[2rem] bg-zinc-100">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-5xl">👤</span>
              )}
            </div>

            <label className="cursor-pointer text-sm font-semibold text-[#6E5AA7]">
              Choose photo
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
          </div>

          <div className="mt-8 grid gap-5">
            <label className="grid gap-2">
              <span className="text-sm font-medium">Nickname</span>
              <input
                value={nickname}
                onChange={(event) => {
                  setNickname(event.target.value);
                }}
                required
                className="rounded-xl border border-zinc-300 px-4 py-3"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium">Bio</span>
              <textarea
                value={bio}
                onChange={(event) => {
                  setBio(event.target.value);
                }}
                rows={4}
                className="rounded-xl border border-zinc-300 px-4 py-3"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium">
                MTG Arena username
              </span>
              <input
                value={arenaUsername}
                onChange={(event) => {
                  setArenaUsername(event.target.value);
                }}
                className="rounded-xl border border-zinc-300 px-4 py-3"
              />
            </label>
          </div>

          {profile ? null : (
            <p className="mt-4 text-sm text-zinc-500">
              Profile loaded from your account.
            </p>
          )}

          {error ? (
            <pre className="mt-5 whitespace-pre-wrap rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </pre>
          ) : null}
        </form>
      </div>
    </main>
  );
}