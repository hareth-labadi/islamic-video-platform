import type { Metadata } from "next";
import { Suspense } from "react";
import { getAdminDictionary, isAdminLocale } from "@/features/admin/i18n";
import { VideoEditorScreen } from "@/features/admin/screens/videos/VideoEditorScreen";
import { ScreenFallback } from "@/features/admin/shell/ScreenFallback";

/** Waits for the signed-in session, like the panel layout (see layout.tsx). */
export const instant = false;

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/videos/new">): Promise<Metadata> {
  const { locale } = await params;
  return isAdminLocale(locale) ? { title: getAdminDictionary(locale).videoForm.newTitle } : {};
}

export default function Page() {
  return (
    <Suspense fallback={<ScreenFallback />}>
      <VideoEditorScreen />
    </Suspense>
  );
}
