import { api } from "@/lib/api";
import {
  buildPlayerDirectoryPath,
  buildPlayersSectionPath,
  type PlayerDirectoryResponse,
  type PlayersView,
} from "@/lib/player-directory";
import {
  buildProfileRelationshipPath,
  getProfileFollowMutationRequest,
  type ProfileFollowMutationResponse,
  type ProfileRelationship,
} from "@/lib/profile-follow";
import {
  buildProfileNetworkPath,
  type ProfileNetworkTab,
} from "@/lib/profile-network";
import {
  buildProfileTrustPath,
  type ProfileTrustSummary,
} from "@/lib/profile-trust";

export type {
  PlayerDirectoryItem,
  PlayerDirectoryResponse,
} from "@/lib/player-directory";
export type {
  ProfileFollowMutationResponse,
  ProfileRelationship,
} from "@/lib/profile-follow";
export type {
  HostTrustSummary,
  PlayerTrustSummary,
  ProfileTrustSummary,
  TrustDisplayState,
} from "@/lib/profile-trust";

export const FAVORITE_PROFILES_CHANGED_EVENT =
  "untapgo:favorite-profiles-changed";

export const BLOCKED_PROFILES_CHANGED_EVENT =
  "untapgo:blocked-profiles-changed";

export const DISTANCE_UNIT_CHANGED_EVENT =
  "untapgo:distance-unit-changed";

export type PublicProfile = {
  id?: string;
  user_id?: string;

  nickname?: string | null;

  avatar_url?: string | null;
  avatarUrl?: string | null;

  bio?: string | null;

  mtg_arena_username?: string | null;
  mtgArenaUsername?: string | null;

  hosted_count?: number | null;
  hostedCount?: number | null;

  played_count?: number | null;
  playedCount?: number | null;

  bio_visible?: boolean | null;
  arena_username_visible?: boolean | null;
  stats_visible?: boolean | null;
  public_decks_visible?: boolean | null;

  location?: PublicProfileLocation | null;
  location_visible?: boolean | null;

  playing_since_year?: number | null;
  first_set_code?: string | null;
  first_set_name?: string | null;
  favorite_colors?: string[] | null;
  favorite_formats?: string[] | null;
};

export type LocationVisibility = "public" | "connections" | "private";

export type PublicProfileLocation = {
  city: string;
  region: string | null;
  country: string;
  country_code: string | null;
  display_name: string;
};

export type ProfileLocation = PublicProfileLocation & {
  place_id: string | null;
  latitude_approx: number | null;
  longitude_approx: number | null;
  visibility: LocationVisibility;
  discovery_enabled: boolean;
  coordinates_available: boolean;
};

export type ProfileLocationPayload = {
  city: string;
  region?: string | null;
  country: string;
  country_code?: string | null;
  place_id?: string | null;
  latitude_approx?: number | null;
  longitude_approx?: number | null;
  visibility: LocationVisibility;
  discovery_enabled: boolean;
};

export type ProfilePrivacySettings = {
  show_bio: boolean;
  show_mtg_arena_username: boolean;
  show_stats: boolean;
  show_public_decks: boolean;
};

export type DistanceUnit = "km" | "mi";

export type DisplayPreferences = {
  distance_unit: DistanceUnit;
};

export type PublicDeck = {
  id: string;

  commander_name?: string | null;
  commanderName?: string | null;

  deck_url?: string | null;
  deckUrl?: string | null;

  format_slug?: string | null;
  formatSlug?: string | null;

  export_text?: string | null;
  exportText?: string | null;

  image_url?: string | null;
  imageUrl?: string | null;

  color_white?: boolean | string | number | null;
  color_blue?: boolean | string | number | null;
  color_black?: boolean | string | number | null;
  color_red?: boolean | string | number | null;
  color_green?: boolean | string | number | null;
  color_colorless?: boolean | string | number | null;
};

export type FavoriteProfile = {
  id?: string;
  user_id?: string;

  nickname?: string | null;

  avatar_url?: string | null;
  avatarUrl?: string | null;

  bio?: string | null;
};

export type BlockedProfile = {
  id?: string;
  user_id?: string;

  nickname?: string | null;

  avatar_url?: string | null;
  avatarUrl?: string | null;

  bio?: string | null;
};

export type BlockStatus = {
  blocked_by_me: boolean;
  blocked_me: boolean;
};

export type UpdateMyProfilePayload = {
  nickname: string;
  avatar_url?: string | null;
  bio?: string | null;
  mtg_arena_username?: string | null;
  playing_since_year?: number | null;
  first_set_code?: string | null;
  first_set_name?: string | null;
  favorite_colors?: string[];
  favorite_formats?: string[];
};

export type ReportUserPayload = {
  reason: string;
  details?: string | null;
};

type PublicProfileOptions = {
  asPublic?: boolean;
};

export async function getPlayerDirectory({
  query,
  page,
}: {
  query: string;
  page: number;
}): Promise<PlayerDirectoryResponse> {
  return api.get<PlayerDirectoryResponse>(
    buildPlayerDirectoryPath({ query, page }),
  );
}

export async function getPlayersSection({
  view,
  currentUserId,
  query,
  page,
}: {
  view: PlayersView;
  currentUserId: string;
  query: string;
  page: number;
}): Promise<PlayerDirectoryResponse> {
  return api.get<PlayerDirectoryResponse>(
    buildPlayersSectionPath({ view, currentUserId, query, page }),
  );
}

export async function getProfileRelationship(
  profileId: string,
): Promise<ProfileRelationship> {
  const result = await api.get<ProfileRelationship>(
    buildProfileRelationshipPath(profileId),
  );

  return {
    is_following: result.is_following === true,
    is_followed_by: result.is_followed_by === true,
    is_mutual: result.is_mutual === true,
  };
}

async function mutateProfileFollow(
  profileId: string,
  mutation: "follow" | "unfollow",
): Promise<ProfileFollowMutationResponse> {
  const request = getProfileFollowMutationRequest(profileId, mutation);
  const result = request.method === "POST"
    ? await api.post<ProfileFollowMutationResponse>(request.path)
    : await api.delete<ProfileFollowMutationResponse>(request.path);

  return {
    ok: result.ok === true,
    is_following: result.is_following === true,
  };
}

export async function followProfile(
  profileId: string,
): Promise<ProfileFollowMutationResponse> {
  return mutateProfileFollow(profileId, "follow");
}

export async function unfollowProfile(
  profileId: string,
): Promise<ProfileFollowMutationResponse> {
  return mutateProfileFollow(profileId, "unfollow");
}

async function getProfileNetwork(
  profileId: string,
  tab: ProfileNetworkTab,
  page: number,
  query = "",
): Promise<PlayerDirectoryResponse> {
  return api.get<PlayerDirectoryResponse>(
    buildProfileNetworkPath({ profileId, tab, page, query }),
  );
}

export async function getProfileFollowers(
  profileId: string,
  page: number,
): Promise<PlayerDirectoryResponse> {
  return getProfileNetwork(profileId, "followers", page);
}

export async function getProfileFollowing(
  profileId: string,
  page: number,
): Promise<PlayerDirectoryResponse> {
  return getProfileNetwork(profileId, "following", page);
}

export async function getProfileTrustSummary(
  profileId: string,
): Promise<ProfileTrustSummary> {
  return api.get<ProfileTrustSummary>(
    buildProfileTrustPath(profileId),
  );
}

function emitBrowserEvent(
  eventName: string,
  detail?: unknown,
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(eventName, {
      detail,
    }),
  );
}

function withPublicView(
  path: string,
  options: PublicProfileOptions,
): string {
  if (!options.asPublic) {
    return path;
  }

  const separator = path.includes("?") ? "&" : "?";

  return `${path}${separator}as_public=true`;
}

export async function getPublicProfile(
  userId: string,
  options: PublicProfileOptions = {},
): Promise<PublicProfile> {
  const path = `/profiles/${encodeURIComponent(userId)}`;

  return api.get<PublicProfile>(
    withPublicView(path, options),
  );
}

export async function getPublicProfileDecks(
  userId: string,
  options: PublicProfileOptions = {},
): Promise<PublicDeck[]> {
  const path = `/profiles/${encodeURIComponent(userId)}/decks`;

  const result = await api.get<
    PublicDeck[] | { decks?: PublicDeck[] }
  >(withPublicView(path, options));

  if (Array.isArray(result)) {
    return result;
  }

  return Array.isArray(result.decks) ? result.decks : [];
}

export async function getMyProfilePrivacy(): Promise<
  ProfilePrivacySettings
> {
  return api.get<ProfilePrivacySettings>(
    "/me/profile/privacy",
  );
}

export async function updateMyProfilePrivacy(
  payload: ProfilePrivacySettings,
): Promise<ProfilePrivacySettings> {
  return api.patch<ProfilePrivacySettings>(
    "/me/profile/privacy",
    payload,
  );
}


export async function getMyDisplayPreferences(): Promise<
  DisplayPreferences
> {
  const result = await api.get<DisplayPreferences>(
    "/me/preferences/display",
  );

  return {
    distance_unit:
      result.distance_unit === "mi" ? "mi" : "km",
  };
}

export async function updateMyDisplayPreferences(
  payload: DisplayPreferences,
): Promise<DisplayPreferences> {
  const result = await api.patch<DisplayPreferences>(
    "/me/preferences/display",
    payload,
  );

  const normalized: DisplayPreferences = {
    distance_unit:
      result.distance_unit === "mi" ? "mi" : "km",
  };

  emitBrowserEvent(
    DISTANCE_UNIT_CHANGED_EVENT,
    normalized.distance_unit,
  );

  return normalized;
}

export function getProfileId(profile: PublicProfile): string {
  return profile.id?.trim() || profile.user_id?.trim() || "";
}

export function getProfileNickname(profile: PublicProfile): string {
  return profile.nickname?.trim() || "Player";
}

export function getProfileAvatarUrl(
  profile: PublicProfile,
): string | null {
  return (
    profile.avatar_url?.trim() ||
    profile.avatarUrl?.trim() ||
    null
  );
}

export function getProfileArenaUsername(
  profile: PublicProfile,
): string | null {
  return (
    profile.mtg_arena_username?.trim() ||
    profile.mtgArenaUsername?.trim() ||
    null
  );
}

export function getHostedCount(profile: PublicProfile): number {
  const count = Number(
    profile.hosted_count ?? profile.hostedCount ?? 0,
  );

  return Number.isFinite(count) ? Math.max(0, count) : 0;
}

export function getPlayedCount(profile: PublicProfile): number {
  const count = Number(
    profile.played_count ?? profile.playedCount ?? 0,
  );

  return Number.isFinite(count) ? Math.max(0, count) : 0;
}

export function getFavoriteProfileId(
  profile: FavoriteProfile,
): string {
  return profile.id?.trim() || profile.user_id?.trim() || "";
}

export function getFavoriteProfileNickname(
  profile: FavoriteProfile,
): string {
  return profile.nickname?.trim() || "Player";
}

export function getFavoriteProfileAvatarUrl(
  profile: FavoriteProfile,
): string | null {
  return (
    profile.avatar_url?.trim() ||
    profile.avatarUrl?.trim() ||
    null
  );
}

export function getBlockedProfileId(
  profile: BlockedProfile,
): string {
  return profile.id?.trim() || profile.user_id?.trim() || "";
}

export function getBlockedProfileNickname(
  profile: BlockedProfile,
): string {
  return profile.nickname?.trim() || "Player";
}

export function getBlockedProfileAvatarUrl(
  profile: BlockedProfile,
): string | null {
  return (
    profile.avatar_url?.trim() ||
    profile.avatarUrl?.trim() ||
    null
  );
}

export function getDeckCommanderName(deck: PublicDeck): string {
  return (
    deck.commander_name?.trim() ||
    deck.commanderName?.trim() ||
    "Unnamed deck"
  );
}

export function getDeckUrl(deck: PublicDeck): string | null {
  return deck.deck_url?.trim() || deck.deckUrl?.trim() || null;
}

export function getDeckFormatSlug(
  deck: PublicDeck,
): string | null {
  return (
    deck.format_slug?.trim() ||
    deck.formatSlug?.trim() ||
    null
  );
}

export function getDeckExportText(
  deck: PublicDeck,
): string | null {
  return (
    deck.export_text?.trim() ||
    deck.exportText?.trim() ||
    null
  );
}

export function getDeckImageUrl(deck: PublicDeck): string | null {
  return (
    deck.image_url?.trim() ||
    deck.imageUrl?.trim() ||
    null
  );
}

export function booleanish(value: unknown): boolean {
  return (
    value === true ||
    value === "true" ||
    value === 1 ||
    value === "1"
  );
}

export function getDeckColors(deck: PublicDeck): string[] {
  const colors: string[] = [];

  if (booleanish(deck.color_white)) colors.push("W");
  if (booleanish(deck.color_blue)) colors.push("U");
  if (booleanish(deck.color_black)) colors.push("B");
  if (booleanish(deck.color_red)) colors.push("R");
  if (booleanish(deck.color_green)) colors.push("G");
  if (booleanish(deck.color_colorless)) colors.push("C");

  return colors.length > 0 ? colors : ["C"];
}

export async function updateMyProfile(
  payload: UpdateMyProfilePayload,
): Promise<PublicProfile> {
  return api.patch<PublicProfile>("/me/profile", {
    nickname: payload.nickname.trim(),
    avatar_url: payload.avatar_url?.trim() || null,
    bio: payload.bio?.trim() || null,
    mtg_arena_username:
      payload.mtg_arena_username?.trim() || null,
  });
}

export async function getMyProfileLocation(): Promise<ProfileLocation | null> {
  return api.get<ProfileLocation | null>("/me/profile/location");
}

export async function updateMyProfileLocation(
  payload: ProfileLocationPayload,
): Promise<ProfileLocation> {
  return api.patch<ProfileLocation>("/me/profile/location", {
    city: payload.city.trim(),
    region: payload.region?.trim() || null,
    country: payload.country.trim(),
    country_code: payload.country_code?.trim().toUpperCase() || null,
    place_id: payload.place_id?.trim() || null,
    latitude_approx: payload.latitude_approx ?? null,
    longitude_approx: payload.longitude_approx ?? null,
    visibility: payload.visibility,
    discovery_enabled: payload.discovery_enabled,
  });
}

export async function removeMyProfileLocation(): Promise<{ ok: boolean }> {
  return api.delete<{ ok: boolean }>("/me/profile/location");
}

export function getProfileLocationDisplay(
  profile: PublicProfile,
): string | null {
  return profile.location?.display_name?.trim() || null;
}

export async function getFavoriteProfiles(): Promise<
  FavoriteProfile[]
> {
  const result = await api.get<
    | FavoriteProfile[]
    | {
        profiles?: FavoriteProfile[];
        favorites?: FavoriteProfile[];
      }
  >("/profiles/me/favorites");

  if (Array.isArray(result)) {
    return result;
  }

  if (Array.isArray(result.profiles)) {
    return result.profiles;
  }

  if (Array.isArray(result.favorites)) {
    return result.favorites;
  }

  return [];
}

export async function clearFavoriteProfiles(): Promise<{
  ok?: boolean;
}> {
  const result = await api.delete<{ ok?: boolean }>(
    "/profiles/me/favorites",
  );

  emitBrowserEvent(FAVORITE_PROFILES_CHANGED_EVENT);

  return result;
}

export async function isFavoriteProfile(
  profileId: string,
): Promise<boolean> {
  const result = await api.get<{ is_favorite?: boolean }>(
    `/profiles/${encodeURIComponent(profileId)}/is-favorite`,
  );

  return result.is_favorite === true;
}

export async function favoriteProfile(
  profileId: string,
): Promise<{ ok?: boolean }> {
  const result = await api.post<{ ok?: boolean }>(
    `/profiles/${encodeURIComponent(profileId)}/favorite`,
    {},
  );

  emitBrowserEvent(FAVORITE_PROFILES_CHANGED_EVENT);

  return result;
}

export async function unfavoriteProfile(
  profileId: string,
): Promise<{ ok?: boolean }> {
  const result = await api.delete<{ ok?: boolean }>(
    `/profiles/${encodeURIComponent(profileId)}/favorite`,
  );

  emitBrowserEvent(FAVORITE_PROFILES_CHANGED_EVENT);

  return result;
}

export async function getBlockedProfiles(): Promise<
  BlockedProfile[]
> {
  const result = await api.get<
    | BlockedProfile[]
    | {
        profiles?: BlockedProfile[];
        blocked?: BlockedProfile[];
      }
  >("/profiles/me/blocked");

  if (Array.isArray(result)) {
    return result;
  }

  if (Array.isArray(result.profiles)) {
    return result.profiles;
  }

  if (Array.isArray(result.blocked)) {
    return result.blocked;
  }

  return [];
}

export async function getBlockStatus(
  profileId: string,
): Promise<BlockStatus> {
  const result = await api.get<Partial<BlockStatus>>(
    `/profiles/${encodeURIComponent(profileId)}/is-blocked`,
  );

  return {
    blocked_by_me: result.blocked_by_me === true,
    blocked_me: result.blocked_me === true,
  };
}

export async function blockProfile(
  profileId: string,
): Promise<{ ok?: boolean; success?: boolean }> {
  const result = await api.post<{
    ok?: boolean;
    success?: boolean;
  }>(
    `/profiles/${encodeURIComponent(profileId)}/block`,
    {},
  );

  emitBrowserEvent(BLOCKED_PROFILES_CHANGED_EVENT, {
    profileId,
    blocked: true,
  });

  return result;
}

export async function unblockProfile(
  profileId: string,
): Promise<{ ok?: boolean; success?: boolean }> {
  const result = await api.delete<{
    ok?: boolean;
    success?: boolean;
  }>(
    `/profiles/${encodeURIComponent(profileId)}/block`,
  );

  emitBrowserEvent(BLOCKED_PROFILES_CHANGED_EVENT, {
    profileId,
    blocked: false,
  });

  return result;
}

export async function reportProfile(
  profileId: string,
  payload: ReportUserPayload,
): Promise<{ ok?: boolean }> {
  return api.post<{ ok?: boolean }>(
    `/profiles/${encodeURIComponent(profileId)}/report`,
    {
      reason: payload.reason.trim(),
      details: payload.details?.trim() || null,
    },
  );
}
