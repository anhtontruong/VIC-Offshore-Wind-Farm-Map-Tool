import { useEffect, type RefObject } from "react";
import { useAppContext } from "../../../hooks/useAppContext";
import type { MapRef } from "../mapHelpers";

/**
 * Shared Camera Sync: moves this screen's map to the shared centre/zoom
 * whenever another screen is driving the camera.
 */
export function useCameraSync(
  mapRef: MapRef,
  syncingRef: RefObject<boolean>,
  screenId: string
) {
  const { center, zoom, cameraOwnerRef } = useAppContext();

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // this map is driving — the shared value is our own
    if (cameraOwnerRef.current === screenId) return;

    // jumpTo also stops any leftover inertia/fly on this map
    syncingRef.current = true;
    map.jumpTo({ center, zoom });
    syncingRef.current = false;
  }, [center, zoom]);
}
