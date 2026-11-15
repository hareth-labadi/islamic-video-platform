import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getSeriesBySlug, seriesList } from "@/data/content";
import { ensureContent } from "@/data/ensure";
import { localeFrom } from "@/i18n/params";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import { SeriesPage } from "@/features/series/SeriesPage";

export async function generateStaticParams() {
  await ensureContent();
  return seriesList.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/series/[slug]">): Promise<Metadata> {
  await ensureContent();
  const series = getSeriesBySlug((await params).slug);
  return { title: series?.title, description: series?.tagline };
}

export default function Page({ params }: PageProps<"/[locale]/series/[slug]">) {
  return (
    <Suspense fallback={<PageSkeleton tone="series" />}>
      <Series params={params} />
    </Suspense>
  );
}

async function Series({ params }: { params: PageProps<"/[locale]/series/[slug]">["params"] }) {
  const { slug } = await params;
  await ensureContent();
  const series = getSeriesBySlug(slug);
  if (!series) notFound();
  return <SeriesPage locale={await localeFrom(params)} seriesId={series.id} />;
}
