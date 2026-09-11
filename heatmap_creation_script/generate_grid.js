const turf = require("@turf/turf");
const proj4 = require("proj4");
const fs = require("fs");

// ============
// File Names
// ============
const CSV_OUTPUT_FILE = "weighted_sum_layouts.ldgeojson";
const GRID_OUTPUT_FILE = "grid.ldgeojson";

const layoutFeatures = readLDGeoJSON(CSV_OUTPUT_FILE);

// Generate grid
const grid = centredGrid(layoutFeatures);

// Write grid as LDGeoJSON
writeLDGeoJSON(grid, GRID_OUTPUT_FILE);

console.log(`Wrote ${grid.features.length} grid cells to ${GRID_OUTPUT_FILE}`);

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

      const wgsRing = utmRing.map(coord =>
        proj4(UTM, WGS84, coord)
      );

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
  const lines = fs
    .readFileSync(filename, "utf8")
    .trim()
    .split(/\r?\n/);

  return {
    type: "FeatureCollection",
    features: lines.map((line) => JSON.parse(line))
  };
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
