import { api } from "@/lib/api";
import {
  buildDiscoverPlaygroupsPath,
  buildMyPlaygroupsPath,
  buildPlaygroupPeoplePath,
  buildPlaygroupRequestActionPath,
  buildPlaygroupResourcePath,
  type MyPlaygroupState,
  type PlaygroupDetail,
  type PlaygroupMemberPage,
  type PlaygroupMembershipResponse,
  type PlaygroupPage,
  type PlaygroupPayload,
} from "@/lib/playgroups";

export type {
  MyPlaygroupState,
  PlaygroupDetail,
  PlaygroupJoinPolicy,
  PlaygroupListItem,
  PlaygroupMember,
  PlaygroupMemberPage,
  PlaygroupMembershipResponse,
  PlaygroupMembershipState,
  PlaygroupPage,
  PlaygroupPayload,
  PlaygroupStatus,
} from "@/lib/playgroups";

export function discoverPlaygroups(query: string, city: string, page: number): Promise<PlaygroupPage> {
  return api.get<PlaygroupPage>(buildDiscoverPlaygroupsPath(query, city, page));
}

export function getMyPlaygroups(state: MyPlaygroupState, page: number): Promise<PlaygroupPage> {
  return api.get<PlaygroupPage>(buildMyPlaygroupsPath(state, page));
}

export function createPlaygroup(payload: PlaygroupPayload): Promise<PlaygroupDetail> {
  return api.post<PlaygroupDetail>("/playgroups", payload);
}

export function getPlaygroup(playgroupId: string): Promise<PlaygroupDetail> {
  return api.get<PlaygroupDetail>(buildPlaygroupResourcePath(playgroupId));
}

export function joinPlaygroup(playgroupId: string): Promise<PlaygroupMembershipResponse> {
  return api.post<PlaygroupMembershipResponse>(buildPlaygroupResourcePath(playgroupId, "/join"));
}

export function leavePlaygroup(playgroupId: string): Promise<PlaygroupMembershipResponse> {
  return api.delete<PlaygroupMembershipResponse>(buildPlaygroupResourcePath(playgroupId, "/membership"));
}

export function getPlaygroupMembers(playgroupId: string, page: number): Promise<PlaygroupMemberPage> {
  return api.get<PlaygroupMemberPage>(buildPlaygroupPeoplePath(playgroupId, "members", page));
}

export function getPlaygroupRequests(playgroupId: string, page: number): Promise<PlaygroupMemberPage> {
  return api.get<PlaygroupMemberPage>(buildPlaygroupPeoplePath(playgroupId, "requests", page));
}

export function approvePlaygroupRequest(playgroupId: string, userId: string): Promise<PlaygroupMembershipResponse> {
  return api.post<PlaygroupMembershipResponse>(buildPlaygroupRequestActionPath(playgroupId, userId, "approve"));
}

export function rejectPlaygroupRequest(playgroupId: string, userId: string): Promise<PlaygroupMembershipResponse> {
  return api.post<PlaygroupMembershipResponse>(buildPlaygroupRequestActionPath(playgroupId, userId, "reject"));
}

export function editPlaygroup(playgroupId: string, payload: PlaygroupPayload): Promise<PlaygroupDetail> {
  return api.patch<PlaygroupDetail>(buildPlaygroupResourcePath(playgroupId), payload);
}

export function archivePlaygroup(playgroupId: string): Promise<PlaygroupDetail> {
  return api.post<PlaygroupDetail>(buildPlaygroupResourcePath(playgroupId, "/archive"));
}
