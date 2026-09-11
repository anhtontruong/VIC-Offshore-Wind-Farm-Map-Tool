const fs = require("fs");
const csv = require("csv-parser");

const inputFile = "weighted_sum_layouts.csv";
const outputFile = "weighted_sum_layouts.ldgeojson";

const features = [];

fs.createReadStream(inputFile)
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
          Number(props.latitude.toFixed(7)),
        ],
      },
    };

    features.push(feature);
  })
  .on("end", () => {
    const output = features
      .map((f) => JSON.stringify(f))
      .join("\n");

    fs.writeFileSync(outputFile, output);

    console.log(`Wrote ${features.length} features to ${outputFile}`);
  });
