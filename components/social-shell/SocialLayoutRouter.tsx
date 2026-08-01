"use client";

import { Suspense, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import NotificationRealtimeProvider from "@/components/notifications/NotificationRealtimeProvider";

import SocialAppShell from "./SocialAppShell";
import { isSocialAppRoute } from "./navigation";

type SocialLayoutRouterProps = {
  children: ReactNode;
  floatingAction?: ReactNode;
};

export default function SocialLayoutRouter(props: SocialLayoutRouterProps) {
  const pathname = usePathname();

  if (["/", "/login", "/signup", "/reset-password"].includes(pathname)) {
    return <AuthGatePage>{props.children}</AuthGatePage>;
  }

  let content: ReactNode;
  if (pathname === "/home") content = <StandaloneSocialPage {...props} />;
  else if (!isSocialAppRoute(pathname)) content = <LegacyChrome {...props} />;
  else content = (
      <Suspense fallback={<SocialAppShell {...props} />}>
        <SocialRouteChrome pathname={pathname} {...props} />
      </Suspense>
    );

  return <NotificationRealtimeProvider>{content}</NotificationRealtimeProvider>;
}

function AuthGatePage({ children }: { children: ReactNode }) {
  return <div className="min-h-screen overflow-x-hidden">{children}</div>;
}

function StandaloneSocialPage({ children, floatingAction }: SocialLayoutRouterProps) {
  return (
    <div className="min-h-screen max-lg:[&_[data-floating-location-trigger]]:bottom-[calc(5.75rem+env(safe-area-inset-bottom))]">
      {children}
      {floatingAction}
    </div>
  );
}

function SocialRouteChrome({ pathname, ...props }: SocialLayoutRouterProps & { pathname: string }) {
  const searchParams = useSearchParams();
  const isFullScreenEventMap = pathname === "/events" && searchParams.get("view") === "map";

  return isFullScreenEventMap
    ? <LegacyChrome {...props} />
    : <SocialAppShell {...props} />;
}

function LegacyChrome({ children, floatingAction }: SocialLayoutRouterProps) {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-24">{children}</main>
      <Footer />
      {floatingAction}
    </>
  );
}
