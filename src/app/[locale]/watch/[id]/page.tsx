import type { Metadata } from "next";
import { Suspense } from "react";
import { getVideo, videos } from "@/data/content";
import { localeFrom } from "@/i18n/params";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import { WatchPage } from "@/features/watch/WatchPage";

export function generateStaticParams() {
  return videos.map((v) => ({ id: v.id }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/watch/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: getVideo(id)?.title };
}

export default function Page({ params }: PageProps<"/[locale]/watch/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton tone="series" />}>
      <Watch params={params} />
    </Suspense>
  );
}

async function Watch({ params }: { params: PageProps<"/[locale]/watch/[id]">["params"] }) {
  const { id } = await params;
  return <WatchPage locale={await localeFrom(params)} id={id} />;
}
