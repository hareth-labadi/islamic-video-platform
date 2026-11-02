import type { Metadata } from "next";
import { series } from "@/data/content";
import { localeFrom } from "@/i18n/params";
import { SeriesPage } from "@/features/series/SeriesPage";

export const metadata: Metadata = { title: series.title };

export default async function Page({ params }: PageProps<"/[locale]/series">) {
  return <SeriesPage locale={await localeFrom(params)} />;
}
