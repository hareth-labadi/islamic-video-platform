import type { Metadata } from "next";
import { Suspense } from "react";
import { getAdminDictionary, isAdminLocale } from "@/features/admin/i18n";
import { CollectionEditorScreen } from "@/features/admin/screens/collections/CollectionEditorScreen";
import { ScreenFallback } from "@/features/admin/shell/ScreenFallback";

/** Waits for the signed-in session, like the panel layout (see layout.tsx). */
export const instant = false;

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/playlists/new">): Promise<Metadata> {
  const { locale } = await params;
  return isAdminLocale(locale) ? { title: getAdminDictionary(locale).collections.metaTitle } : {};
}

export default function Page() {
  return (
    <Suspense fallback={<ScreenFallback />}>
      <CollectionEditorScreen />
    </Suspense>
  );
}
