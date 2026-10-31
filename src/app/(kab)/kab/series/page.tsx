import type { Metadata } from "next";
import { SeriesPage } from "@/features/series/SeriesPage";

export const metadata: Metadata = { title: "Dala'il an-Nubuwwa" };

export default function Page() {
  return <SeriesPage locale="kab" />;
}
