const fs = require("fs");
const turf = require("@turf/turf");
const csv = require("csv-parser");

// ============
//  File Names
// ============
const GRID_FILE = "grid.ldgeojson";
const CSV_FILE = "weighted_sum_layouts.csv";

const CSV_OUTPUT_FILE = "weighted_sum_layouts.ldgeojson";
const OUTPUT_FILE = "heatmap.ldgeojson";

// =====================
//  1) CSV to ldgeojson
// =====================
console.log(`Converting ${CSV_FILE} to .ldgeojson format...\n`);
const ldgeojsonLine = [];
fs.createReadStream(CSV_FILE)
  .pipe(csv())
  .on("data", (row) => {
    // Convert all values to numbers where possible
    const props = {};

    for (const [key, value] of Object.entries(row)) {
      const n = Number(value);
      props[key] = Number.isNaN(n) ? value : n;
    }

    const feature = {
      type: "Feature",
      properties: props,
      geometry: {
        type: "Point",
        coordinates: [
          Number(props.longitude.toFixed(7)),
          Number(props.latitude.toFixed(7))
        ]
      }
    };

    ldgeojsonLine.push(feature);
  })
  .on("end", () => {
    const output = ldgeojsonLine.map((f) => JSON.stringify(f)).join("\n");

    fs.writeFileSync(CSV_OUTPUT_FILE, output);

    console.log(
      `SUCCESS! Wrote ${ldgeojsonLine.length} features to ${CSV_OUTPUT_FILE}\n`
    );

    // ======================================================
    //  2) Merge grid and datapoints into a new HEATMAP grid
    // ======================================================
    console.log(
      `Merging ${CSV_OUTPUT_FILE} into ${GRID_FILE} to create heatmap...\n`
    );
    const gridFeatures = readGeoJSONL(GRID_FILE);
    const layoutFeatures = readGeoJSONL(CSV_OUTPUT_FILE);

    // initialise aggregation store per polygon
    const gridLookup = new Map();

    for (const feature of gridFeatures) {
      gridLookup.set(feature.properties.id, {
        feature,
        matched: false
      });
    }

    // assign each weighted-sum point to a grid polygon
    for (const point of layoutFeatures) {
      let matchedGrid = null;

      for (const polygon of gridFeatures) {
        if (turf.booleanPointInPolygon(point, polygon)) {
          matchedGrid = polygon;
          break;
        }
      }

      if (!matchedGrid) continue;

      const props = point.properties;
      const gridEntry = gridLookup.get(matchedGrid.properties.id);

      // write common metadata once
      if (!gridEntry.matched) {
        Object.assign(gridEntry.feature.properties, {
          longitude: props.longitude,
          latitude: props.latitude,
          cell_id: props.cell_id,
          cf: props.cf,
          depth_m: props.depth_m,
          wind_speed_m_s: props.wind_speed_m_s,
          shore_km: props.shore_km,
          e_w: props.e_w,
          n_surveys: props.n_surveys
        });

        gridEntry.matched = true;
      }

      const lambdaKey =
        `${Math.round(props.lambda1 * 100)}_` +
        `${Math.round(props.lambda2 * 100)}_` +
        `${Math.round(props.lambda3 * 100)}`;

      gridEntry.feature.properties[lambdaKey] = props.t_w;
    }

    // write output geojsonl
    const out = [];

    for (const feature of gridFeatures) {
      out.push(JSON.stringify(feature));
    }

    fs.writeFileSync(OUTPUT_FILE, out.join("\n"));

    console.log(
      `SUCCESS! Wrote ${gridFeatures.length} features to ${OUTPUT_FILE}\n`
    );
  });

// =================
//  Helper Function
// =================
function readGeoJSONL(path) {
  return fs
    .readFileSync(path, "utf8")
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}
