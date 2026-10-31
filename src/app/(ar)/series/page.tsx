import type { Metadata } from "next";
import { SeriesPage } from "@/features/series/SeriesPage";

export const metadata: Metadata = { title: "دلائل النبوّة" };

export default function Page() {
  return <SeriesPage locale="ar" />;
}
