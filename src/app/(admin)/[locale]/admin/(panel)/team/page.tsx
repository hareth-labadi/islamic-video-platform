import type { Metadata } from "next";
import { Suspense } from "react";
import { getAdminDictionary, isAdminLocale } from "@/features/admin/i18n";
import { TeamScreen } from "@/features/admin/screens/team/TeamScreen";
import { ScreenFallback } from "@/features/admin/shell/ScreenFallback";

/** Waits for the signed-in session, like the panel layout (see layout.tsx). */
export const instant = false;

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/team">): Promise<Metadata> {
  const { locale } = await params;
  return isAdminLocale(locale) ? { title: getAdminDictionary(locale).team.metaTitle } : {};
}

export default function Page() {
  return (
    <Suspense fallback={<ScreenFallback />}>
      <TeamScreen />
    </Suspense>
  );
}
