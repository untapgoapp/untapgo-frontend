"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { PlaygroupContentAuthor } from "@/lib/playgroup-communications";

export default function PlaygroupContentAvatar({
  author,
  className = "h-10 w-10",
}: {
  author: PlaygroupContentAuthor;
  className?: string;
}) {
  const nickname = author.nickname.trim() || "Player";
  const avatarUrl = author.avatar_url?.trim() || null;

  return (
    <Avatar className={`${className} bg-secondary`}>
      {avatarUrl ? <AvatarImage src={avatarUrl} alt="" className="object-cover" /> : null}
      <AvatarFallback className="text-xs">{nickname.slice(0, 1).toUpperCase()}</AvatarFallback>
    </Avatar>
  );
}
