"use client";

import { useEffect } from "react";

/** Asks before closing or reloading the tab while a form has unsaved changes. */
export function useUnsavedWarning(active: boolean, message: string) {
  useEffect(() => {
    if (!active) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message;
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [active, message]);
}
