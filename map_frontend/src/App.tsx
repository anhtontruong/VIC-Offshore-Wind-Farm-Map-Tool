import { useRef, useState } from "react";
import "./App.css";
import LeftBar from "./LeftBar";
import Map from "./Map";
import { INITIAL_CENTER, INITIAL_ZOOM } from "./constants";

import { MantineProvider, createTheme } from '@mantine/core';
import '@mantine/core/styles.css';

import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import '@fontsource/inter/900.css';

const theme = createTheme({
  fontFamily: "Inter, sans-serif",
  headings: {
    fontWeight: "400"
  }
})

export default function App() {
  // # States
  const [expanded, setExpanded] = useState(true);
  const [center, setCenter] = useState(INITIAL_CENTER);
  const [zoom, setZoom] = useState(INITIAL_ZOOM);

  const mapRef = useRef<mapboxgl.Map | null>(null); // persists map instance

  // # Helper Functions
  const handleButtonClick = () => {
    mapRef.current?.flyTo({
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM
    });
  };

  return (
    <MantineProvider theme={theme}>
      <title>VIC Offshore Wind Farm Map Tool</title>
      
      
      <div className="left">
        <LeftBar expanded={expanded} setExpanded={setExpanded} />
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
              onClick={handleButtonClick}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <Map mapRef={mapRef} setCenter={setCenter} setZoom={setZoom} />
    </MantineProvider>
  );
}
