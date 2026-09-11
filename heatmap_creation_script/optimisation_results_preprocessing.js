const fs = require("fs");
const turf = require("@turf/turf");
const csv = require("csv-parser");
const proj4 = require("proj4");

// ============
//  File Names
// ============
const DATA_CSV_FILE = process.argv[2];
if (!DATA_CSV_FILE) {
  console.error("MISSING csv file as argument! Should be: node optimisation_results_preprocessing.js <csv-file>");
  process.exit(1);
}

const GRID_FILE = "grid.ldgeojson";
const DATA_LDGEOJSON_FILE = "optimisation_data.ldgeojson";
const OUTPUT_FILE = "heatmap.ldgeojson";

// =====================
//  1) CSV to ldgeojson
// =====================
console.log(`Converting ${DATA_CSV_FILE} to .ldgeojson format...\n`);
const ldgeojsonLine = [];
fs.createReadStream(DATA_CSV_FILE)
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

    fs.writeFileSync(DATA_LDGEOJSON_FILE, output);

    console.log(
      `SUCCESS! Wrote ${ldgeojsonLine.length} features to ${DATA_LDGEOJSON_FILE}\n`
    );

    // =================
    // 2) Generate Grid
    // =================
    console.log(
      `Generating grid base on ${DATA_LDGEOJSON_FILE}, writing to ${GRID_FILE}...\n`
    );
    const layoutFeatures = readLDGeoJSON(DATA_LDGEOJSON_FILE);

    // Generate grid
    const grid = centredGrid({
      type: "FeatureCollection",
      features: layoutFeatures
    });

    // Write grid as LDGeoJSON
    writeLDGeoJSON(grid, GRID_FILE);

    console.log(`Wrote ${grid.features.length} grid cells to ${GRID_FILE}\n`);

    // ======================================================
    //  2) Merge grid and datapoints into a new HEATMAP grid
    // ======================================================
    console.log(
      `Merging ${DATA_LDGEOJSON_FILE} into ${GRID_FILE} to create heatmap...\n`
    );
    const gridFeatures = readLDGeoJSON(GRID_FILE);

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

// =============
//  Create Grid
// =============
function centredGrid(points) {
  const WGS84 = "EPSG:4326";

  proj4.defs(
    "EPSG:32755",
    "+proj=utm +zone=55 +south +datum=WGS84 +units=m +no_defs"
  );

  const UTM = "EPSG:32755";

  // Get bbox of all points
  const bbox = turf.bbox(points);

  // Project bbox corners to UTM
  const [minX, minY] = proj4(WGS84, UTM, [bbox[0], bbox[1]]);
  const [maxX, maxY] = proj4(WGS84, UTM, [bbox[2], bbox[3]]);

  // Expand by 500m so outer points fall in cell centres
  const startX = Math.floor((minX - 500) / 1000) * 1000;
  const startY = Math.floor((minY - 500) / 1000) * 1000;

  const endX = Math.ceil((maxX + 500) / 1000) * 1000;
  const endY = Math.ceil((maxY + 500) / 1000) * 1000;

  const features = [];

  for (let x = startX; x < endX; x += 1000) {
    for (let y = startY; y < endY; y += 1000) {
      const utmRing = [
        [x, y],
        [x + 1000, y],
        [x + 1000, y + 1000],
        [x, y + 1000],
        [x, y]
      ];

      const wgsRing = utmRing.map((coord) => proj4(UTM, WGS84, coord));

      features.push(
        turf.polygon([wgsRing], {
          fid: features.length + 1,
          id: features.length + 1,
          left: x,
          right: x + 1000,
          bottom: y,
          top: y + 1000
        })
      );
    }
  }

  return turf.featureCollection(features);
}

// ==================
// Read LDGeoJSON
// ==================
function readLDGeoJSON(filename) {
  return fs
    .readFileSync(filename, "utf8")
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

// ==================
// Write LDGeoJSON
// ==================
function writeLDGeoJSON(featureCollection, filename) {
  const lines = featureCollection.features
    .map((feature) => JSON.stringify(feature))
    .join("\n");

  fs.writeFileSync(filename, lines, "utf8");
}
