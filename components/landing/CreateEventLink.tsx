"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

import { useUser } from "@/hooks/useUser";

type CreateEventLinkProps = Omit<ComponentProps<typeof Link>, "href">;

export default function CreateEventLink(props: CreateEventLinkProps) {
  const { user } = useUser();

  return (
    <Link
      href={user ? "/create" : "/login?next=%2Fcreate"}
      {...props}
    />
  );
}
