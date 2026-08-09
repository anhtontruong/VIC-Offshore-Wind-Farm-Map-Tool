const fs = require("fs");
const { Noise } = require("noisejs");

const inputFile = "Grid.ldgeojson";
const outputFile = "FormattedGrid.ldgeojson";

const noise = new Noise(1);

const SCALE = 0.1;

const lines = fs
    .readFileSync(inputFile, "utf8")
    .split(/\r?\n/)
    .filter(line => line.trim() !== "");

const updatedLines = lines.map(line => {
    const feature = JSON.parse(line);

    const row = feature.properties.row_index;
    const col = feature.properties.col_index;

    // TODO: Update as dense flat array
    // [-1, 1]
    const n = Array(11).fill(0).map((_, z) => (noise.perlin3(
        col * SCALE,
        row * SCALE,
        z
    )));

    // normalize to [0, 1]
    const value = n.map(elem => Number(((elem + 1) / 2).toFixed(4)));

    feature.properties = {
        ...feature.properties,
        cell_details: {
            "Cell Detail A": "description",
            "Cell Detail B": "description",
        },
        value: value
    };

    return JSON.stringify(feature);
});

fs.writeFileSync(
    outputFile,
    updatedLines.join("\n"),
    "utf8"
);
