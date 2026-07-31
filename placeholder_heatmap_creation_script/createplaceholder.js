const fs = require("fs");

const inputFile = "Grid.ldgeojson";
const outputFile = "FormattedGrid.ldgeojson";

// Read
const lines = fs.readFileSync(inputFile, "utf8")
  .split(/\r?\n/)
  .filter(line => line.trim() !== "");

const updatedLines = lines.map(line => {
  const feature = JSON.parse(line);

  // Add new properties
  feature.properties = {
    ...feature.properties,
    "Cell Detail A": "description",
    "Cell Detail B": "description"
  };

  return JSON.stringify(feature);
});

// Write
fs.writeFileSync(outputFile, updatedLines.join("\n"), "utf8");

console.log(`Updated ${updatedLines.length} features.`);
console.log(`Output written to ${outputFile}`);
