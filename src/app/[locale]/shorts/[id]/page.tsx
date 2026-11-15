import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getShort, shorts } from "@/data/content";
import { ensureContent } from "@/data/ensure";
import { localeFrom } from "@/i18n/params";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import { ShortsFeed } from "@/features/shorts/ShortsFeed";

export async function generateStaticParams() {
  await ensureContent();
  return shorts.map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/shorts/[id]">): Promise<Metadata> {
  const { id } = await params;
  await ensureContent();
  return { title: getShort(id)?.title };
}

/** A shared link to one clip: the same feed, opened on that clip. */
export default function Page({ params }: PageProps<"/[locale]/shorts/[id]">) {
  // The clip id comes from the URL: render it inside Suspense so navigation can show the shell at once.
  return (
    <Suspense fallback={<PageSkeleton variant="feed" tone="short" />}>
      <Feed params={params} />
    </Suspense>
  );
}

async function Feed({ params }: { params: PageProps<"/[locale]/shorts/[id]">["params"] }) {
  const { id } = await params;
  await ensureContent();
  if (!getShort(id)) notFound();
  return <ShortsFeed locale={await localeFrom(params)} initialId={id} />;
}
