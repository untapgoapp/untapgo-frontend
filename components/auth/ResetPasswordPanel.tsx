"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { friendlyAuthError } from "@/lib/auth";
import { supabase } from "@/lib/supabase/client";

import styles from "./AuthLanding.module.css";

export default function ResetPasswordPanel({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmation) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);
    setError(null);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      router.replace(nextPath);
      router.refresh();
    } catch (updateError) {
      setError(friendlyAuthError(updateError, "update-password"));
      setPassword("");
      setConfirmation("");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className={styles.authPanel} aria-labelledby="reset-password-title" aria-busy={pending}>
      <p className={styles.panelEyebrow}>Account security</p>
      <h2 id="reset-password-title">Choose a new password</h2>
      <p className={styles.panelIntro}>Enter a new password to finish recovering your account.</p>
      <form onSubmit={updatePassword} className={styles.authForm} noValidate>
        <label htmlFor="new-password">New password</label>
        <input id="new-password" type="password" name="password" autoComplete="new-password" minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} disabled={pending} />
        <label htmlFor="confirm-password">Confirm new password</label>
        <input id="confirm-password" type="password" name="password-confirmation" autoComplete="new-password" minLength={6} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={pending} />
        {error ? <p className={styles.authError} role="alert">{error}</p> : null}
        <button type="submit" className={styles.primaryButton} disabled={pending}>
          {pending ? "Updating…" : "Update password"}
        </button>
      </form>
      <Link className={styles.modeLink} href="/?auth=recover">Request another reset link</Link>
    </section>
  );
}
