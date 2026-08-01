import type { ReactNode } from "react";

type SocialRightSidebarProps = {
  children: ReactNode;
};

export default function SocialRightSidebar({
  children,
}: SocialRightSidebarProps) {
  return (
    <aside className="hidden xl:block" aria-label="Contextual sidebar">
      <div className="sticky top-0 max-h-screen overflow-y-auto py-5">
        {children}
      </div>
    </aside>
  );
}
