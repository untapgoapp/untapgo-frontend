import Image from "next/image";
import Link from "next/link";

import type { AuthMode } from "@/lib/auth";

import AuthPanel from "./AuthPanel";
import LandingManaBackground from "./LandingManaBackground";
import ResetPasswordPanel from "./ResetPasswordPanel";
import styles from "./AuthLanding.module.css";

export default function AuthLanding({
  initialMode = "login",
  nextPath,
  oauthFailed = false,
  passwordCompletion = false,
}: {
  initialMode?: AuthMode;
  nextPath: string;
  oauthFailed?: boolean;
  passwordCompletion?: boolean;
}) {
  return (
    <main className={styles.page} data-auth-landing>
      <div className={styles.shell}>
        <header className={styles.header}>
          <Link href="/" className={styles.brand} aria-label="UntapGo home">
            <Image src="/logo.png" width={46} height={46} priority alt="" />
            <span>UntapGo</span>
          </Link>
        </header>

        <div className={styles.layout}>
          <section className={styles.brandCopy} aria-labelledby="landing-title">
            <LandingManaBackground />
            <div className={styles.brandCopyContent}>
              <p className={styles.eyebrow}>Your local Magic community</p>
              <h1 id="landing-title">Your Magic community, all in one place.</h1>
              <p className={styles.supportingCopy}>
                Find players, join games and keep your Magic community together.
              </p>
            </div>
          </section>

          <div className={styles.authentication} aria-label="Authentication">
            {passwordCompletion
              ? <ResetPasswordPanel nextPath={nextPath} />
              : <AuthPanel initialMode={initialMode} nextPath={nextPath} oauthFailed={oauthFailed} />}
          </div>
        </div>

        <footer className={styles.footer}>
          <span>© 2026 UntapGo</span>
          <nav aria-label="Legal">
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
          </nav>
        </footer>
      </div>
    </main>
  );
}
