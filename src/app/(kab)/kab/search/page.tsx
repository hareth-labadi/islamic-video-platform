import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchResults } from "@/features/search/SearchResults";

export const metadata: Metadata = { title: "Nadi" };

export default function Page() {
  return (
    <Suspense>
      <SearchResults locale="kab" />
    </Suspense>
  );
}
