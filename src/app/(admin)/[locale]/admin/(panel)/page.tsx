import type { Metadata } from "next";
import { getAdminDictionary, isAdminLocale } from "@/features/admin/i18n";
import { DashboardScreen } from "@/features/admin/screens/dashboard/DashboardScreen";

/** Waits for the signed-in session, like the panel layout (see layout.tsx). */
export const instant = false;

export async function generateMetadata({ params }: PageProps<"/[locale]/admin">): Promise<Metadata> {
  const { locale } = await params;
  return isAdminLocale(locale) ? { title: getAdminDictionary(locale).dashboard.metaTitle } : {};
}

export default function Page() {
  return <DashboardScreen />;
}
