import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getSheikhBySlug, sheikhs } from "@/data/content";
import { ensureContent } from "@/data/ensure";
import { localeFrom } from "@/i18n/params";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import { SheikhProfile } from "@/features/sheikhs/SheikhPages";

export async function generateStaticParams() {
  await ensureContent();
  return sheikhs.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/sheikhs/[slug]">): Promise<Metadata> {
  const locale = await localeFrom(params);
  await ensureContent();
  const sheikh = getSheikhBySlug((await params).slug);
  return { title: sheikh?.name[locale], description: sheikh?.bio?.[locale] };
}

export default function Page({ params }: PageProps<"/[locale]/sheikhs/[slug]">) {
  return (
    <Suspense fallback={<PageSkeleton tone="ink" />}>
      <Profile params={params} />
    </Suspense>
  );
}

async function Profile({ params }: { params: PageProps<"/[locale]/sheikhs/[slug]">["params"] }) {
  const { slug } = await params;
  await ensureContent();
  const sheikh = getSheikhBySlug(slug);
  if (!sheikh) notFound();
  return <SheikhProfile sheikh={sheikh} locale={await localeFrom(params)} />;
}
