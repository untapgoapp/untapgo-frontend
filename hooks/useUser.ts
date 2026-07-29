"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const session = data.session;

      if (session) {
        setUser(session.user);
        localStorage.setItem("supabase_token", session.access_token);
      } else {
        localStorage.removeItem("supabase_token");
      }

      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          setUser(session.user);
          localStorage.setItem("supabase_token", session.access_token);
        } else {
          setUser(null);
          localStorage.removeItem("supabase_token");
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}
