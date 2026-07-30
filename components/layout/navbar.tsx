"use client";

import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/lib/supabase";
import {
  unregisterPushBeforeSignOut,
} from "@/services/push";

export function Navbar() {
  const { user } = useUser();

  async function logout() {
    await unregisterPushBeforeSignOut();
    await supabase.auth.signOut();
    localStorage.removeItem("supabase_token");
  }

  return (
    <header className="border-b p-3 flex justify-between items-center">
      <span className="font-semibold">UntapGo</span>

      <div className="flex items-center gap-2">
        {user ? (
          <>
            <span className="text-sm text-zinc-500">
              {user.email}
            </span>
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
          </>
        ) : (
          <Button onClick={() => (window.location.href = "/login")}>
            Login
          </Button>
        )}
      </div>
    </header>
  );
}
