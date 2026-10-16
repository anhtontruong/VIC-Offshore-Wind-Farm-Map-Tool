import { useEffect, type RefObject } from "react";
import mapboxgl from "mapbox-gl";
import { ScreenMode, useAppContext } from "../../../hooks/useAppContext";
import type { MapRef } from "../mapHelpers";
import { buildPopupHTML } from "../popupHtml";

/**
 * Shared Cell Popups: keeps this screen's popups in step with the open cells
 * shared by every screen.
 */
export function useCellPopups(
  mapRef: MapRef,
  popupsRef: RefObject<Record<number, mapboxgl.Popup>>,
  paramKeyRef: RefObject<string>,
  paramKeyBRef: RefObject<string>,
  mapLoaded: boolean
) {
  const { openCells, closeCell, screenMode } = useAppContext();
  const isAggregate2 = screenMode === ScreenMode.One_Screen_Aggregate_2;

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // add popups for cells opened elsewhere
    for (const cell of openCells) {
      if (popupsRef.current[cell.id]) continue;

      const popup = new mapboxgl.Popup({
        closeOnClick: false,
        maxWidth: "300px"
      })
        .setLngLat(cell.lngLat)
        .setHTML(
          buildPopupHTML(
            cell,
            paramKeyRef.current,
            // capacity for A + B in aggregate mode
            isAggregate2 ? paramKeyBRef.current : undefined
          )
        )
        .addTo(map);

      // x button: close this popup on every screen
      popup.on("close", () => closeCell(cell.id));

      // latest popup above previous
      const popupElement = popup.getElement();
      popupElement?.addEventListener("mousedown", () => {
        const parent = popupElement.parentElement;
        if (parent) {
          parent.appendChild(popupElement);
        }
      });

      popupsRef.current[cell.id] = popup;
    }

    // remove popups for cells that were closed elsewhere
    for (const key of Object.keys(popupsRef.current)) {
      const id = Number(key);
      if (!openCells.some((c) => c.id === id)) {
        popupsRef.current[id].remove();
        delete popupsRef.current[id];
      }
    }
  }, [openCells, mapLoaded]);
}
