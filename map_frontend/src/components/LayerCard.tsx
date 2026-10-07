import { ActionIcon, RangeSlider, Slider, Text, Tooltip } from "@mantine/core";
import {
  IconEye,
  IconEyeOff,
  IconGripVertical,
  IconMask,
  IconRefresh,
  IconSquareToggle
} from "@tabler/icons-react";
import type {
  DraggableAttributes,
  DraggableSyntheticListeners
} from "@dnd-kit/core";
import type { CSSProperties, Ref } from "react";
import { LAYER_COLORS, LAYER_INFO } from "../constants/constants";
import {
  fullRange,
  isFullRange,
  type Layer
} from "../hooks/useScenarioContext";
import { useExpandedContext } from "../hooks/useExpandedContext";

interface LayerCardProps {
  name: string;
  info?: string;
  layer?: Layer; // omitted for the fixed base layer (no controls)
  onChange?: (patch: Partial<Layer>) => void;
  // sortable wiring (from useSortable), omitted for the fixed base layer
  cardRef?: Ref<HTMLDivElement>;
  handleRef?: Ref<HTMLDivElement>;
  style?: CSSProperties;
  dragging?: boolean;
  handleAttributes?: DraggableAttributes;
  handleListeners?: DraggableSyntheticListeners;
}

// ================ //
//     COMPONENT
// ================ //
/**
 * Card for a single layer in the Layer Stack.
 */
export default function LayerCard({
  name,
  info,
  layer,
  onChange,
  cardRef,
  handleRef,
  style,
  dragging,
  handleAttributes,
  handleListeners
}: LayerCardProps) {
  // # Context
  const { expanded } = useExpandedContext();

  // # Layer Info (null for the fixed base layer)
  const layerInfo = layer ? LAYER_INFO[layer.key] : null;
  const unit = layerInfo?.unit ? ` ${layerInfo.unit}` : "";
  const formatValue = (value: number) =>
    layerInfo ? value.toFixed(layerInfo.decimals) : "";

  // # JSX
  return (
    <div
      ref={cardRef}
      style={
        {
          ...style,
          ...(layer && { "--layer-color": LAYER_COLORS[layer.key].max })
        } as CSSProperties
      }
      className={`layer-card ${layer ? "" : "base"} ${
        layer && !layer.visible ? "hidden-layer" : ""
      } ${layer?.masking ? "masking-layer" : ""} ${dragging ? "dragging" : ""} ${
        expanded ? "content-expanded" : "content-collapsed"
      }`}
    >
      {/* GRIP RAIL (drag handle) */}
      {layer && (
        <div
          ref={handleRef}
          className="layer-grip"
          aria-label={`Reorder ${name}`}
          {...handleAttributes}
          {...handleListeners}
        >
          <IconGripVertical size={16} />
        </div>
      )}

      <div className="layer-card-main">
        {/* HEADER */}
        <div className="layer-card-header">
          <div className="layer-card-name">
            <Text size="sm" fw={600} truncate title={name}>
              {name}
            </Text>
            {info && (
              <Text size="xs" c="dimmed" fs="italic" truncate>
                {info}
              </Text>
            )}
          </div>

          {/* ACTIONS */}
          {layer && onChange && (
            <div className="layer-card-actions">
              <Tooltip label={layer.visible ? "Hide layer" : "Show layer"}>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="gray"
                  aria-label={layer.visible ? "Hide layer" : "Show layer"}
                  onClick={() => onChange({ visible: !layer.visible })}
                >
                  {layer.visible ? (
                    <IconEye size={16} />
                  ) : (
                    <IconEyeOff size={16} />
                  )}
                </ActionIcon>
              </Tooltip>

              <Tooltip label="Invert range">
                <ActionIcon
                  size="sm"
                  variant={layer.inverted ? "light" : "subtle"}
                  color={layer.inverted ? "blue" : "gray"}
                  aria-label="Invert range"
                  aria-pressed={layer.inverted}
                  onClick={() => onChange({ inverted: !layer.inverted })}
                >
                  <IconSquareToggle size={16} />
                </ActionIcon>
              </Tooltip>

              <Tooltip label="Mask out layers below">
                <ActionIcon
                  size="sm"
                  variant={layer.masking ? "light" : "subtle"}
                  // matches the masking slider colour in App.css
                  color={layer.masking ? "#334155" : "gray"}
                  aria-label="Mask out layers below"
                  aria-pressed={layer.masking}
                  onClick={() => onChange({ masking: !layer.masking })}
                >
                  <IconMask size={16} />
                </ActionIcon>
              </Tooltip>
            </div>
          )}
        </div>

        {/* SLIDERS */}
        {layer && layerInfo && onChange && (
          <div className="layer-card-body">
            {/* RANGE */}
            <div className="layer-control-label">
              <span className="layer-control-name">
                Range
                <Tooltip label="Reset range">
                  <ActionIcon
                    className="layer-reset"
                    size="xs"
                    variant="light"
                    color="red"
                    aria-label="Reset range"
                    disabled={isFullRange(layer)}
                    onClick={() => onChange(fullRange(layer.key))}
                  >
                    <IconRefresh size={12} />
                  </ActionIcon>
                </Tooltip>
              </span>
              <span className="layer-control-value">
                {`${formatValue(layer.range[0])} - ${formatValue(layer.range[1])}${unit}`}
              </span>
            </div>
            <RangeSlider
              size="sm"
              min={layerInfo.min}
              max={layerInfo.max}
              step={layerInfo.step}
              minRange={layerInfo.step}
              inverted={layer.inverted}
              value={layer.range}
              label={(value) => `${formatValue(value)}${unit}`}
              onChange={(range) => onChange({ range })}
            />

            {/* OPACITY */}
            <div className="layer-control-label">
              <span>Opacity</span>
              <span className="layer-control-value">
                {layer.opacity.toFixed(2)}
              </span>
            </div>
            <Slider
              size="sm"
              min={0}
              max={1}
              step={0.01}
              value={layer.opacity}
              // a masking layer isn't drawn itself, so its opacity does nothing
              disabled={layer.masking}
              label={(value) => value.toFixed(2)}
              onChange={(opacity) => onChange({ opacity })}
            />
          </div>
        )}
      </div>
    </div>
  );
}
