import SocialNavigation from "./SocialNavigation";

export default function SocialDesktopSidebar() {
  return (
    <aside className="hidden lg:block" aria-label="Application sidebar">
      <div className="sticky top-16 flex h-[calc(100dvh-4rem)] flex-col py-5 pr-4">
        <SocialNavigation variant="desktop" />

        <div className="mt-auto border-t border-border/65 pt-4">
          <SocialNavigation variant="desktop-secondary" />
          <p className="mt-4 px-3 text-xs leading-5 text-quiet-foreground">
            Find a table. Meet players. Keep playing.
          </p>
        </div>
      </div>
    </aside>
  );
}
