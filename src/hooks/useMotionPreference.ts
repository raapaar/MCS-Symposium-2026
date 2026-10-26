import { useSyncExternalStore } from "react";

const motionQuery = "(prefers-reduced-motion: reduce)";

function subscribe(callback: () => void) {
  const media = window.matchMedia(motionQuery);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

export function useMotionPreference() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(motionQuery).matches,
    () => true,
  );
}
