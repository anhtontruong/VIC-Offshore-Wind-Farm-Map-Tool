import { useEffect, type RefObject } from "react";
import type { MapRef } from "../mapHelpers";

/**
 * Container Size: resizes the map whenever its container changes size
 * (screen mode change, window resize).
 */
export function useMapResize(
  mapRef: MapRef,
  mapContainerRef: RefObject<HTMLDivElement | null>,
  syncingRef: RefObject<boolean>
) {
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      const map = mapRef.current;
      if (!map) return;

      // resize re-fires move — don't let it publish or claim the camera
      syncingRef.current = true;
      map.resize();
      syncingRef.current = false;
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);
}
