import type { Metadata } from "next";
import { getVideo, videos } from "@/data/content";
import { WatchPage } from "@/features/watch/WatchPage";

export function generateStaticParams() {
  return videos.map((v) => ({ id: v.id }));
}

export async function generateMetadata({ params }: PageProps<"/kab/watch/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: getVideo(id)?.title };
}

export default async function Page({ params }: PageProps<"/kab/watch/[id]">) {
  const { id } = await params;
  return <WatchPage locale="kab" id={id} />;
}
