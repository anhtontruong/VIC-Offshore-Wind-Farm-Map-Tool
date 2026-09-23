import { useRef } from "react";
import { useExpandedContext } from "../hooks/useExpandedContext";
import { INITIAL_CENTER, INITIAL_ZOOM } from "../constants/constants";
import LeftBar from "./LeftBar";
import Map from "./Map";
import { useAppContext } from "../hooks/useAppContext";

export default function Scenario() {
  const { expanded } = useExpandedContext();
  const mapRef = useRef<mapboxgl.Map | null>(null); // persists map instance
  const { center, zoom, clearAllPopups } = useAppContext();

  // # Helper Functions
  const handleButtonClickReset = () => {
    mapRef.current?.flyTo({
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM
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
            <button
              className={`action-button reset-button ${expanded ? "expanded" : "collapsed"}`}
              onClick={handleButtonClickReset}
            >
              Reset Position
            </button>

            <button
              className={`action-button clear-popup-button ${expanded ? "expanded" : "collapsed"}`}
              onClick={clearAllPopups}
            >
              Clear All Popups
            </button>
          </div>
        </div>
      </div>

      <Map mapRef={mapRef} />
    </div>
  );
}
