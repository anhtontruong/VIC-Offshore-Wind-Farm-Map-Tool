import { useRef } from "react";
import { Tooltip } from "@mantine/core";
import { IconCurrentLocation, IconEraser } from "@tabler/icons-react";
import { useExpandedContext } from "../hooks/useExpandedContext";
import { INITIAL_CENTER, INITIAL_ZOOM } from "../constants/constants";
import LeftBar from "./LeftBar";
import Map from "./Map";
import { ScreenMode, useAppContext } from "../hooks/useAppContext";
import { useScenarioContext } from "../hooks/useScenarioContext";

export default function Scenario() {
  const { expanded } = useExpandedContext();
  const mapRef = useRef<mapboxgl.Map | null>(null); // persists map instance
  const { center, zoom, clearAllPopups, screenMode, uiHidden } =
    useAppContext();
  const { getParam } = useScenarioContext();

  // # Helper Functions
  const handleButtonClickReset = () => {
    // split screens are narrower (same height): zoom out more per extra screen
    const resetZoom =
      screenMode === ScreenMode.One_Screen
        ? INITIAL_ZOOM
        : screenMode === ScreenMode.Two_Screen
          ? INITIAL_ZOOM - 0.5
          : INITIAL_ZOOM - 1;

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
            {!uiHidden && (
              <div className={`info ${expanded ? "expanded" : "collapsed"}`}>
                {`Longitude: ${center[0].toFixed(4)}  | Latitude: ${center[1].toFixed(4)}  |  Zoom: ${zoom.toFixed(2)}`}
              </div>
            )}
          </div>
          {!uiHidden && (
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
          )}
        </div>
      </div>

      {uiHidden && (
        <div className="lambda-bar">
          {([0, 1, 2] as const).map((i) => (
            <div className="lambda-cell" key={i}>
              <span className="lambda-label">{`Lambda${i + 1}`}</span>
              <span className="lambda-value">{getParam(i).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      <Map mapRef={mapRef} />
    </div>
  );
}
