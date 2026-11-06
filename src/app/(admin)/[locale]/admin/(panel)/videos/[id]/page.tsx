import { Suspense } from "react";
import { VideoEditorScreen } from "@/features/admin/screens/videos/VideoEditorScreen";
import { ScreenFallback } from "@/features/admin/shell/ScreenFallback";

/** Waits for the signed-in session, like the panel layout (see layout.tsx). */
export const instant = false;

export default function Page() {
  return (
    <Suspense fallback={<ScreenFallback />}>
      <VideoEditorScreen />
    </Suspense>
  );
}
