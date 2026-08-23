import { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css"; // Associated CSS
import { INITIAL_CENTER, INITIAL_ZOOM } from "../constants/constants";
import { useScenarioContext } from "../hooks/useScenarioContext";

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

  const { params, getParam } = useScenarioContext();

  const getHeatMapKeyFromParams = () => {
    const key = `${getParam(0)*10}_${getParam(1)*10}_${getParam(2)*10}`;
    return key;
  }

  // ==============
  //    Map Load
  // ==============
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
      mapRef.current.addSource("heatmap-grid", {
        type: "vector",
        url: "mapbox://anhtont.k6edsdvvw2x4"
      });

      mapRef.current.addLayer({
        id: "grid-fill",
        type: "fill",
        source: "heatmap-grid",
        "source-layer": "55e59ee2edfe45515692",
        paint: {
          "fill-color": [
            "step",
            // TODO: Update
            ["get", "0_10_0"],
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
        // TODO, reformat cell detail UI [after Vector TileSet update]

        new mapboxgl.Popup({ closeOnClick: false })
          .setLngLat(e.lngLat)
          .setHTML(
            `<div>
                <b>Longitude:</b> ${e.lngLat.lng}<br/>
                <b>Latitude:</b> ${e.lngLat.lat}<br/>
                <b>Value:</b> ${props.value_1}<br/>
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

  // ================
  //    Map Update
  // ================
  useEffect(() => {
    const map = mapRef.current;

    if (!map) return;
    if (!map.getLayer("grid-fill")) return;

    map.setPaintProperty("grid-fill", "fill-color", [
      "step",
      ["get", getHeatMapKeyFromParams()],
      "rgba(0,0,0,0)", // transparent or "#fa2828"
      0.6,
      "#fac000",
      0.8,
      "#78db00"
    ]);
  }, [params]);

  // # JSX
  return (
    <>
      {/* map, change CSS for position and size */}
      <div id="map-container" ref={mapContainerRef} />
    </>
  );
}
