import SocialNavigation from "./SocialNavigation";

export default function SocialBottomNavigation() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-border/80 bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <SocialNavigation variant="mobile" />
    </div>
  );
}
