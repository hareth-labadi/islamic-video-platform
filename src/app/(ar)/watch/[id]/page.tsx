import type { Metadata } from "next";
import { getVideo, videos } from "@/data/content";
import { WatchPage } from "@/features/watch/WatchPage";

export function generateStaticParams() {
  return videos.map((v) => ({ id: v.id }));
}

export async function generateMetadata({ params }: PageProps<"/watch/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: getVideo(id)?.title };
}

export default async function Page({ params }: PageProps<"/watch/[id]">) {
  const { id } = await params;
  return <WatchPage locale="ar" id={id} />;
}
