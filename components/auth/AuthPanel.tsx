"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

import {
  friendlyAuthError,
  isExistingSignupUser,
  type AuthMode,
} from "@/lib/auth";
import { supabase } from "@/lib/supabase/client";

import styles from "./AuthLanding.module.css";

export default function AuthPanel({
  initialMode,
  nextPath,
  oauthFailed = false,
}: {
  initialMode: AuthMode;
  nextPath: string;
  oauthFailed?: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState<"form" | "google" | null>(null);
  const [error, setError] = useState<string | null>(
    oauthFailed ? "Google sign-in could not be completed. Please try again." : null,
  );
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
    setError(oauthFailed ? "Google sign-in could not be completed. Please try again." : null);
    setVerificationEmail(null);
  }, [initialMode, oauthFailed]);

  function changeMode(nextMode: AuthMode) {
    if (pending) return;
    setMode(nextMode);
    setPassword("");
    setError(null);
    setVerificationEmail(null);
  }

  function finishAuthentication() {
    router.replace(nextPath);
    router.refresh();
  }

  async function handleGoogleSignIn() {
    if (pending) return;
    setPending("google");
    setError(null);
    const callback = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback },
    });
    if (oauthError) {
      setError(friendlyAuthError(oauthError, "google"));
      setPending(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const normalizedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Enter a valid email address.");
      return;
    }
    if (mode !== "recover" && !password) {
      setError("Enter your password.");
      return;
    }
    if (mode === "signup" && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setPending("form");
    setError(null);
    try {
      if (mode === "recover") {
        const resetDestination = `/reset-password?next=${encodeURIComponent(nextPath)}`;
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          normalizedEmail,
          {
            redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(resetDestination)}`,
          },
        );
        if (resetError) throw resetError;
        setVerificationEmail(normalizedEmail);
        return;
      }

      if (mode === "signup") {
        const { data, error: signupError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
          },
        });
        if (signupError) throw signupError;
        if (isExistingSignupUser(data.user)) {
          setError("An account with this email already exists. Try logging in.");
          return;
        }
        if (data.session) finishAuthentication();
        else setVerificationEmail(normalizedEmail);
        return;
      }

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });
      if (loginError) throw loginError;
      finishAuthentication();
    } catch (authenticationError) {
      setError(friendlyAuthError(authenticationError, mode));
      setPassword("");
    } finally {
      setPending(null);
    }
  }

  if (verificationEmail) {
    const passwordReset = mode === "recover";
    return (
      <section className={styles.authPanel} aria-labelledby="auth-verification-title" aria-live="polite">
        <p className={styles.panelEyebrow}>{passwordReset ? "Password reset" : "Account verification"}</p>
        <h2 id="auth-verification-title">Check your email</h2>
        <p className={styles.panelIntro}>
          {passwordReset
            ? `If an account exists for ${verificationEmail}, reset instructions are on their way.`
            : `We sent a confirmation link to ${verificationEmail}. Open it to finish creating your account.`}
        </p>
        <button type="button" className={styles.primaryButton} onClick={() => changeMode("login")}>
          Return to login
        </button>
      </section>
    );
  }

  const title = mode === "login" ? "Log in to UntapGo" : mode === "signup" ? "Create your account" : "Reset your password";
  return (
    <section className={styles.authPanel} aria-labelledby="auth-panel-title" aria-busy={Boolean(pending)}>
      <p className={styles.panelEyebrow}>{mode === "signup" ? "Join the community" : "Welcome"}</p>
      <h2 id="auth-panel-title">{title}</h2>
      <p className={styles.panelIntro}>
        {mode === "recover" ? "Enter your email and we’ll send you a secure reset link." : "Continue to your players, games and playgroups."}
      </p>

      {mode !== "recover" ? (
        <button type="button" className={styles.oauthButton} onClick={() => void handleGoogleSignIn()} disabled={Boolean(pending)}>
          {pending === "google" ? <span className={styles.spinner} aria-hidden="true" /> : <Image src="/google-g.svg" width={18} height={18} alt="" />}
          {pending === "google" ? "Connecting…" : "Continue with Google"}
        </button>
      ) : null}

      {mode !== "recover" ? <div className={styles.divider}><span>or use email</span></div> : null}

      <form onSubmit={handleSubmit} className={styles.authForm} noValidate>
        <label htmlFor="auth-email">Email</label>
        <input id="auth-email" name="email" type="email" autoComplete="email" inputMode="email" required value={email} onChange={(event) => setEmail(event.target.value)} disabled={pending === "form"} />
        {mode !== "recover" ? (
          <>
            <div className={styles.passwordLabel}><label htmlFor="auth-password">Password</label>{mode === "login" ? <button type="button" onClick={() => changeMode("recover")}>Forgot password?</button> : null}</div>
            <input id="auth-password" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} disabled={pending === "form"} />
          </>
        ) : null}
        {error ? <p className={styles.authError} role="alert">{error}</p> : null}
        <button type="submit" className={styles.primaryButton} disabled={Boolean(pending)}>
          {pending === "form" ? "Please wait…" : mode === "login" ? "Log in" : mode === "signup" ? "Create account" : "Send reset link"}
        </button>
      </form>

      {mode === "login" ? <button type="button" className={styles.secondaryButton} onClick={() => changeMode("signup")} disabled={Boolean(pending)}>Create account</button> : null}
      {mode !== "login" ? <button type="button" className={styles.modeLink} onClick={() => changeMode("login")} disabled={Boolean(pending)}>Back to login</button> : null}
      {mode === "signup" ? <p className={styles.legalNote}>By creating an account, you agree to the <Link href="/terms">Terms</Link> and acknowledge the <Link href="/privacy">Privacy Policy</Link>.</p> : null}
    </section>
  );
}
