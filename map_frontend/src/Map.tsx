import { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css"; // Associated CSS
import { INITIAL_CENTER, INITIAL_ZOOM } from "./constants";

interface MapProps {
  mapRef: React.RefObject<mapboxgl.Map | null>;
  setCenter: React.Dispatch<React.SetStateAction<[number, number]>>;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
}

// ================ //
//     COMPONENT
// ================ //
export default function Map({ mapRef, setCenter, setZoom }: MapProps) {
  // # Refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null); // exposes html

  // # Effects
  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapRef.current = new mapboxgl.Map({
      accessToken:
        "pk.eyJ1IjoiYW5odG9udCIsImEiOiJjbXM2c2o4NDIwNWI4MzBvbzMzaGRzNjF5In0.q0dcFpdPMRLIoTuWtWQzKA",
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/standard-satellite",
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM
    });

    // # Listeners
    // HEATMAP
    mapRef.current.on("load", () => {
      if (!mapRef.current) return;

      // TODO: Change off of on load if do scenario exploration sliders
      mapRef.current.addSource("grid-heatmap", {
        type: "vector",
        url: "mapbox://anhtont.d37ftirb2f95"
      });

      mapRef.current.addLayer({
        id: "grid-fill",
        type: "fill",
        source: "grid-heatmap",
        "source-layer": "e72f97beb2a44f25eb86",
        paint: {
          "fill-color": [
            "step",
            ["get", "value"],
            "rgba(0,0,0,0)", // transparent or "#fa2828"
            0.6,
            "#fac000",
            0.8,
            "#78db00"
          ],
          "fill-opacity": 0.3
        }
      });
    });

    mapRef.current.on("click", "grid-fill", (e) => {
      console.log("clicked");
      const feature = e.features?.[0];

      if (!feature) return;

      console.log((feature as any).properties);
    });

    mapRef.current.on("move", () => {
      if (!mapRef.current) return;

      // get the current center coords and zoom
      const mapCenter = mapRef.current.getCenter();
      const mapZoom = mapRef.current.getZoom();

      setCenter([mapCenter.lng, mapCenter.lat]);
      setZoom(mapZoom);
    });

    mapRef.current.addInteraction("places-click-interaction", {
      type: "click",
      target: { layerId: "grid-fill" },
      handler: (e) => {
        if (!e.feature || !mapRef.current || !e.lngLat) return;

        const props = e.feature.properties;

        console.log(e.feature.properties);
        // TODO, reformat tileset so cell details is a object [after Vector TileSet update]
        // TODO, reformat cell detail UI [after Vector TileSet update]

        // TODO, move cell details into an express backend, keep only style attr for Vector Tiles
        new mapboxgl.Popup({ closeOnClick: false })
          .setLngLat(e.lngLat)
          .setHTML(
            `<div>
                <b>Longitude:</b> ${e.lngLat.lng}<br/>
                <b>Latitude:</b> ${e.lngLat.lat}<br/>
                <b>Value:</b> ${props.value}<br/>
                <b>Cell Detail A:</b> details <br/>
                <b>Cell Detail A:</b> details <br/>
              </div>`
          )
          .addTo(mapRef.current);
      }
    });

    return () => {
      mapRef.current?.remove();
    };
  }, []);

  // # JSX
  return (
    <>
      {/* map, change CSS for position and size */}
      <div id="map-container" ref={mapContainerRef} />
    </>
  );
}
