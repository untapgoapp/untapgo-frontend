import { api } from "@/lib/api";

export type Me = {
  id?: string;
  user_id?: string;
  email?: string | null;
  profile?: {
    id?: string;
    nickname?: string | null;
  } | null;
};

export async function getMe(): Promise<Me | null> {
  try {
    return await api.get<Me>("/me");
  } catch {
    return null;
  }
}

export function getMeId(me: Me | null) {
  return me?.id || me?.user_id || me?.profile?.id || null;
}