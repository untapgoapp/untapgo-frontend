import type {
  Metadata,
  Viewport,
} from "next";
import "mapbox-gl/dist/mapbox-gl.css";
import "./globals.css";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FloatingLocationPill from "@/components/location/FloatingLocationPill";
import { LocationProvider } from "@/components/location/LocationContext";
import PwaBootstrap from "@/components/pwa/PwaBootstrap";
import {
  DistanceUnitProvider,
} from "@/components/settings/DistanceUnitProvider";

export const metadata: Metadata = {
  metadataBase: new URL("https://untapgo.com"),
  title: "UntapGo",
  description: "Find Magic games and open tables near you.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "UntapGo",
  },
};

export const viewport: Viewport = {
  themeColor: "#6E5AA7",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#F8F5EF]">
        <DistanceUnitProvider>
          <LocationProvider>
            <Header />

            <main className="min-h-screen pt-24">
              {children}
            </main>

            <Footer />

            <FloatingLocationPill />
            <PwaBootstrap />
          </LocationProvider>
        </DistanceUnitProvider>
      </body>
    </html>
  );
}
