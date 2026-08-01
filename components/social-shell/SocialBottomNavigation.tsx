"use client";

import { useCallback, useState } from "react";

import MobileMoreSheet from "./MobileMoreSheet";
import SocialNavigation from "./SocialNavigation";

export default function SocialBottomNavigation() {
  const [moreOpen, setMoreOpen] = useState(false);
  const closeMore = useCallback(() => setMoreOpen(false), []);

  return (
    <>
      <div
        data-mobile-bottom-navigation
        className="fixed inset-x-0 bottom-0 z-[60] overflow-x-hidden border-t border-border/80 bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      >
        <SocialNavigation
          variant="mobile"
          moreOpen={moreOpen}
          onMoreOpen={() => setMoreOpen(true)}
        />
      </div>
      <MobileMoreSheet open={moreOpen} onClose={closeMore} />
    </>
  );
}
