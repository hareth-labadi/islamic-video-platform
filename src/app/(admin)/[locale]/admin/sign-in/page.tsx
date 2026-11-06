import type { Metadata } from "next";
import { Suspense } from "react";
import { getAdminDictionary, isAdminLocale } from "@/features/admin/i18n";
import { SignInScreen } from "@/features/admin/screens/auth/SignInScreen";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/sign-in">): Promise<Metadata> {
  const { locale } = await params;
  return isAdminLocale(locale) ? { title: getAdminDictionary(locale).signIn.metaTitle } : {};
}

export default function Page() {
  return (
    <Suspense>
      <SignInScreen />
    </Suspense>
  );
}
