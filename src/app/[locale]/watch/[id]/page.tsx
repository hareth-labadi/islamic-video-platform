import type { Metadata } from "next";
import { getVideo, videos } from "@/data/content";
import { localeFrom } from "@/i18n/params";
import { WatchPage } from "@/features/watch/WatchPage";

export function generateStaticParams() {
  return videos.map((v) => ({ id: v.id }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/watch/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: getVideo(id)?.title };
}

export default async function Page({ params }: PageProps<"/[locale]/watch/[id]">) {
  const { id } = await params;
  return <WatchPage locale={await localeFrom(params)} id={id} />;
}
