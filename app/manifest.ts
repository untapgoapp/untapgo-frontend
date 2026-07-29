import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "UntapGo",
    short_name: "UntapGo",
    description: "Find Magic games and open tables near you.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#F8F5EF",
    theme_color: "#6E5AA7",
    categories: ["games", "social", "lifestyle"],
  };
}
