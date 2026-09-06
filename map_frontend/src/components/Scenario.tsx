import { useRef } from "react";
import { useExpandedContext } from "../hooks/useExpandedContext";
import { INITIAL_CENTER, INITIAL_ZOOM } from "../constants/constants";
import { ScenarioProvider } from "../hooks/useScenarioContext";
import LeftBar from "./LeftBar";
import Map from "./Map";
import type { Popup } from "mapbox-gl";

interface ScenarioProps {
  center: number[];
  zoom: number;
  setCenter: React.Dispatch<React.SetStateAction<[number, number]>>;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
}

export default function Scenario({ center, zoom, setCenter, setZoom }: ScenarioProps) {
  const { expanded } = useExpandedContext();
  const mapRef = useRef<mapboxgl.Map | null>(null); // persists map instance
  const popupsRef = useRef<Popup[]>([]);

  // # Helper Functions
  const handleButtonClickReset = () => {
    mapRef.current?.flyTo({
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM
    });
  };

  const clearAllPopups = () => {
    popupsRef.current.forEach((popup) => popup.remove());
    popupsRef.current = [];
  };

  return (
    <ScenarioProvider>
      <div className="left">
        <LeftBar />
        <div className="left-ui">
          <div className="left-ui-top">
            <div className={`info ${expanded ? "expanded" : "collapsed"}`}>
              Longitude: {center[0].toFixed(4)}
              {" | "}
              Latitude: {center[1].toFixed(4)}
              {" | "}
              Zoom: {zoom.toFixed(2)}
            </div>
          </div>
          <div className="left-ui-bottom">
            <button
              className={`reset-button ${expanded ? "expanded" : "collapsed"}`}
              onClick={handleButtonClickReset}
            >
              Reset
            </button>

            <button
              className={`clear-popup-button ${expanded ? "expanded" : "collapsed"}`}
              onClick={clearAllPopups}
            >
              Clear All Popups
            </button>

          </div>
        </div>
      </div>

      <Map mapRef={mapRef} setCenter={setCenter} setZoom={setZoom} popupsRef={popupsRef}/>
    </ScenarioProvider>
  );
}
