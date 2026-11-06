import { Skeleton } from "../ui/display";

/** Placeholder while a screen that reads the URL (ids, ?tab=…) waits to render. */
export function ScreenFallback() {
  return (
    <div className="flex flex-col gap-5" role="status">
      <Skeleton className="h-12 w-64" />
      <Skeleton className="h-16 rounded-tile" />
      <Skeleton className="h-80 rounded-tile" />
    </div>
  );
}
