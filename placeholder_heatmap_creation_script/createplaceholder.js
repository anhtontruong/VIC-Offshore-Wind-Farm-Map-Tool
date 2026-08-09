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
    const n = noise.perlin2(
        col * SCALE,
        row * SCALE
    );

    // normalize to [0, 1]
    const value = (n + 1) / 2;

    feature.properties = {
        ...feature.properties,
        cell_details: {
            "Cell Detail A": "description",
            "Cell Detail B": "description",
        },
        value: Number(value.toFixed(4))
    };

    return JSON.stringify(feature);
});

fs.writeFileSync(
    outputFile,
    updatedLines.join("\n"),
    "utf8"
);
