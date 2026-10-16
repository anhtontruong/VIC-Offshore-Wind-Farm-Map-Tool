import rangeJSON from "../../../../heatmap_creation_script/range.json";
import { Viewing, type Layer } from "../../hooks/useScenarioContext";
import {
  AGGREGATE_2_COLORS,
  BIRD_COLORS,
  DEPTH_COLORS,
  HEATMAP_COLORS,
  HEATMAP_OLD_COLORS,
  HEATMAP_OLD_RANGE_MW,
  HEATMAP_RANGE_MW,
  LANDING_POINT_COLOR,
  LAYER_COLORS,
  LAYER_INFO,
  WIND_COLORS,
  type LayerColors
} from "../../constants/constants";
import { AGGREGATE_RANGE, layerRamp, STAR_PATH } from "./mapHelpers";

interface MapLegendProps {
  viewing: Viewing;
  layers: Layer[];
}

// ================ //
//     COMPONENT
// ================ //
/**
 * Stack of legend cards in the map's top-right corner: the selected Data, each
 * drawn Layer Stack overlay, and the landing point star.
 */
export default function MapLegend({ viewing, layers }: MapLegendProps) {
  // # JSX
  return (
    <div className="map-legend-stack">
      <DataLegend viewing={viewing} />
      {/* drawn layer stack overlays, in stack order */}
      {layers
        .filter((layer) => layer.visible && !layer.masking)
        .map((layer) => (
          <GradientLegend
            key={layer.key}
            title={LAYER_INFO[layer.key].name}
            unit={LAYER_INFO[layer.key].unit}
            range={rangeJSON[layer.key] as [number, number]}
            colors={LAYER_COLORS[layer.key]}
          />
        ))}
      <div className="map-legend">
        <div className="map-legend-row">
          <svg width="14" height="14" viewBox="0 0 24 24">
            <path
              d={STAR_PATH}
              fill={LANDING_POINT_COLOR}
              stroke="#111827"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
          <span>Landing Point</span>
        </div>
      </div>
    </div>
  );
}

// ==============
//  Data Legend
// ==============
interface DataLegendProps {
  viewing: Viewing;
}

/**
 * Map legend entry for the selected Data.
 */
function DataLegend({ viewing }: DataLegendProps) {
  // CASE: Capacity gradient
  if (viewing === Viewing.Heatmap) {
    return (
      <div className="map-legend">
        <div className="map-legend-title">Heatmap</div>
        <div className="map-legend-gradient-row">
          <div
            className="map-legend-gradient"
            style={{
              background: `linear-gradient(to right, ${HEATMAP_COLORS.ramp.join(", ")})`
            }}
          />
          <div className="map-legend-labels">
            <span>{`${HEATMAP_RANGE_MW[0]} MW`}</span>
            <span>{`${HEATMAP_RANGE_MW[1]} MW`}</span>
          </div>
        </div>
      </div>
    );
  }

  // CASE: Old capacity gradient + discrete zero
  if (viewing === Viewing.Heatmap_Old) {
    return (
      <div className="map-legend">
        <div className="map-legend-title">Heatmap (Old Colour)</div>
        <div className="map-legend-gradient-row">
          <div
            className="map-legend-gradient"
            style={{
              background: `linear-gradient(to right, ${HEATMAP_OLD_COLORS.low}, ${HEATMAP_OLD_COLORS.high})`
            }}
          />
          <div className="map-legend-labels">
            <span>{`${HEATMAP_OLD_RANGE_MW[0]} MW`}</span>
            <span>{`${HEATMAP_OLD_RANGE_MW[1]} MW`}</span>
          </div>
        </div>
        <div className="map-legend-row">
          <span
            className="map-legend-swatch"
            style={{ backgroundColor: HEATMAP_OLD_COLORS.zero }}
          />
          <span>0 MW</span>
        </div>
      </div>
    );
  }

  // CASE: Number of solutions gradient
  if (viewing === Viewing.Aggregate_Heatmap) {
    return (
      <div className="map-legend">
        <div className="map-legend-title">Number of Solutions</div>
        <div className="map-legend-gradient-row">
          <div
            className="map-legend-gradient"
            style={{
              background: `linear-gradient(to right, ${HEATMAP_COLORS.ramp.join(", ")})`
            }}
          />
          <div className="map-legend-labels">
            <span>{AGGREGATE_RANGE[0]}</span>
            <span>{AGGREGATE_RANGE[1]}</span>
          </div>
        </div>
      </div>
    );
  }

  // CASE: Which of Parameters A / B each cell has a solution in
  if (viewing === Viewing.Aggregate_Heatmap_2) {
    const categories = [
      { color: AGGREGATE_2_COLORS.neither, label: "Not in A or B" },
      { color: AGGREGATE_2_COLORS.aOnly, label: "In A only" },
      { color: AGGREGATE_2_COLORS.bOnly, label: "In B only" },
      { color: AGGREGATE_2_COLORS.both, label: "In both A and B" }
    ];

    return (
      <div className="map-legend">
        <div className="map-legend-title">Aggregate Heatmap (2)</div>
        {categories.map((category) => (
          <div className="map-legend-row" key={category.label}>
            <span
              className="map-legend-swatch"
              style={{ backgroundColor: category.color }}
            />
            <span>{category.label}</span>
          </div>
        ))}
      </div>
    );
  }

  // CASE: Continuous range
  let title: string;
  let unit: string;
  let range: [number, number];
  let colors: LayerColors;

  if (viewing === Viewing.Water_Depth) {
    title = "Water Depth";
    unit = "m";
    range = rangeJSON.depth_m as [number, number];
    colors = DEPTH_COLORS;
  } else if (viewing === Viewing.Wind_Speed) {
    title = "Wind Speed";
    unit = "m/s";
    range = rangeJSON.wind_speed_m_s as [number, number];
    colors = WIND_COLORS;
  } else {
    title = "Bird Risk";
    unit = "";
    range = rangeJSON.e_w as [number, number];
    colors = BIRD_COLORS;
  }

  return (
    <GradientLegend
      title={title}
      unit={unit}
      range={range}
      colors={colors}
    />
  );
}

// =================
//  Gradient Legend
// =================
interface GradientLegendProps {
  title: string;
  unit: string;
  range: [number, number];
  colors: LayerColors;
}

/**
 * Map legend entry showing a title above a min-to-max colour gradient with its
 * range labels.
 */
function GradientLegend({
  title,
  unit,
  range,
  colors
}: GradientLegendProps) {
  const [min, max] = range;
  // min on left, max on right
  const gradient = `linear-gradient(to right, ${layerRamp(colors).join(", ")})`;
  const formatValue = (value: number) =>
    unit ? `${value.toFixed(2)} ${unit}` : value.toFixed(2);

  // # JSX
  return (
    <div className="map-legend">
      <div className="map-legend-title">{title}</div>
      <div className="map-legend-gradient-row">
        <div className="map-legend-gradient" style={{ background: gradient }} />
        <div className="map-legend-labels">
          <span>{formatValue(min)}</span>
          <span>{formatValue(max)}</span>
        </div>
      </div>
    </div>
  );
}
