import { notFound } from "next/navigation";
import { getVideo } from "@/data/content";
import type { Locale } from "@/lib/types";
import { WatchView } from "./WatchView";

export function WatchPage({ locale, id }: { locale: Locale; id: string }) {
  const video = getVideo(id);
  if (!video) notFound();
  return <WatchView locale={locale} videoId={video.id} />;
}
