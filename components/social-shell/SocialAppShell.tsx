import type { ReactNode } from "react";

import SocialBottomNavigation from "./SocialBottomNavigation";
import SocialDesktopSidebar from "./SocialDesktopSidebar";
import SocialMobileHeader from "./SocialMobileHeader";
import SocialRightSidebar from "./SocialRightSidebar";

export type SocialAppShellProps = {
  children: ReactNode;
  rightSidebar?: ReactNode;
  mobileContextualContent?: ReactNode;
  floatingAction?: ReactNode;
};

export default function SocialAppShell({
  children,
  rightSidebar,
  mobileContextualContent,
  floatingAction,
}: SocialAppShellProps) {
  const hasRightSidebar = rightSidebar !== undefined && rightSidebar !== null && rightSidebar !== false;

  return (
    <div
      data-social-app-shell
      className="min-h-screen bg-background text-foreground max-lg:[&_[data-floating-location-trigger]]:bottom-[calc(5.75rem+env(safe-area-inset-bottom))]"
    >
      <SocialMobileHeader />

      <div
        className={[
          "mx-auto grid min-h-screen w-full max-w-[1480px] grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-6 lg:px-6",
          hasRightSidebar ? "xl:grid-cols-[220px_minmax(0,1fr)_17rem]" : "",
        ].join(" ")}
      >
        <SocialDesktopSidebar />

        <div id="social-main-content" className="min-w-0 pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
          {mobileContextualContent ? (
            <div className="bg-surface-subtle px-4 py-4 xl:hidden">
              {mobileContextualContent}
            </div>
          ) : null}
          {children}
        </div>

        {hasRightSidebar ? (
          <SocialRightSidebar>{rightSidebar}</SocialRightSidebar>
        ) : null}
      </div>

      <SocialBottomNavigation />
      {floatingAction}
    </div>
  );
}
