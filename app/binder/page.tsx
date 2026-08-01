import { Suspense } from "react";

import BinderDashboard from "@/components/binder/BinderDashboard";

export default function BinderPage() {
  return (
    <Suspense fallback={<main className="min-h-screen px-4 py-8 lg:px-0"><div className="h-40 animate-pulse rounded-surface bg-muted" /></main>}>
      <BinderDashboard />
    </Suspense>
  );
}
