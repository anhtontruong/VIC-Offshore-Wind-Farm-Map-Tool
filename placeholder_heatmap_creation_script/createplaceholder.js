const fs = require("fs");
const { Noise } = require("noisejs");

const inputFile = "Grid.ldgeojson";
const outputFile = "FormattedGrid.ldgeojson";

const noise = new Noise(1);

const SCALE = 0.1;

const lines = fs
  .readFileSync(inputFile, "utf8")
  .split(/\r?\n/)
  .filter((line) => line.trim() !== "");

const updatedLines = lines.map((line) => {
  const feature = JSON.parse(line);

  const row = feature.properties.row_index;
  const col = feature.properties.col_index;

  // TODO: Update as dense flat array
  // [-1, 1]
  const rand_arr = Array(11)
    .fill(0)
    .map((_, z) => noise.perlin3(col * SCALE, row * SCALE, z));

  // normalize to [0, 1]
  const norm_rand_arr = rand_arr.map((elem) =>
    Number(((elem + 1) / 2).toFixed(4))
  );

  const norm_rand_json = Object.fromEntries(norm_rand_arr.map((value, i) => [`value_${i + 1}`, value]));

  feature.properties = {
    ...feature.properties,
    // TODO, shift below into express backend
    // cell_details: {
    //     "Cell Detail A": "description",
    //     "Cell Detail B": "description",
    // },
    ...norm_rand_json
  };

  return JSON.stringify(feature);
});

fs.writeFileSync(outputFile, updatedLines.join("\n"), "utf8");
