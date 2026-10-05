import { useRef } from "react";
import { Tooltip } from "@mantine/core";
import { IconCurrentLocation, IconEraser } from "@tabler/icons-react";
import { useExpandedContext } from "../hooks/useExpandedContext";
import { INITIAL_CENTER, INITIAL_ZOOM } from "../constants/constants";
import LeftBar from "./LeftBar";
import Map from "./Map";
import { ScreenMode, useAppContext } from "../hooks/useAppContext";

export default function Scenario() {
  const { expanded } = useExpandedContext();
  const mapRef = useRef<mapboxgl.Map | null>(null); // persists map instance
  const { center, zoom, clearAllPopups, screenMode } = useAppContext();

  // # Helper Functions
  const handleButtonClickReset = () => {
    // split screens are half as wide: one zoom level out shows the same area
    const resetZoom =
      screenMode === ScreenMode.One_Screen ? INITIAL_ZOOM : INITIAL_ZOOM - 1;

    mapRef.current?.flyTo({
      center: INITIAL_CENTER,
      zoom: resetZoom
    });
  };

  return (
    <div className="map-panel">
      <div className="left">
        <LeftBar />
        <div className="left-ui">
          <div className="left-ui-top">
            <div className={`info ${expanded ? "expanded" : "collapsed"}`}>
              {`Longitude: ${center[0].toFixed(4)}  | Latitude: ${center[1].toFixed(4)}  |  Zoom: ${zoom.toFixed(2)}`}
            </div>
          </div>
          <div className="left-ui-bottom">
            <Tooltip label="Reset Position" position="top">
              <button
                className={`action-button reset-button ${expanded ? "expanded" : "collapsed"}`}
                onClick={handleButtonClickReset}
                aria-label="Reset Position"
              >
                <IconCurrentLocation size={22} />
              </button>
            </Tooltip>

            <Tooltip label="Clear All Popups" position="top">
              <button
                className={`action-button clear-popup-button ${expanded ? "expanded" : "collapsed"}`}
                onClick={clearAllPopups}
                aria-label="Clear All Popups"
              >
                <IconEraser size={22} />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>

      <Map mapRef={mapRef} />
    </div>
  );
}
