import { Suspense } from "react";
import { CollectionEditorScreen } from "@/features/admin/screens/collections/CollectionEditorScreen";
import { ScreenFallback } from "@/features/admin/shell/ScreenFallback";

/** Waits for the signed-in session, like the panel layout (see layout.tsx). */
export const instant = false;

export default function Page() {
  return (
    <Suspense fallback={<ScreenFallback />}>
      <CollectionEditorScreen />
    </Suspense>
  );
}
