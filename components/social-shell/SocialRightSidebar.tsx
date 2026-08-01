import type { ReactNode } from "react";

type SocialRightSidebarProps = {
  children: ReactNode;
};

export default function SocialRightSidebar({
  children,
}: SocialRightSidebarProps) {
  return (
    <aside className="hidden xl:block" aria-label="Contextual sidebar">
      <div className="sticky top-16 max-h-[calc(100dvh-4rem)] overflow-y-auto py-5">
        {children}
      </div>
    </aside>
  );
}
