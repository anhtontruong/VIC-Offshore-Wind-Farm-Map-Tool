import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import {
  restrictToParentElement,
  restrictToVerticalAxis
} from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import LayerCard from "./LayerCard";
import {
  fullRange,
  isFullRange,
  useScenarioContext,
  Viewing,
  type Layer
} from "../hooks/useScenarioContext";
import { LAYER_INFO, type LayerKey } from "../constants/constants";

// # Viewing Labels (shown on the Base Layer card)
const VIEWING_LABELS: Record<Viewing, string> = {
  [Viewing.Heatmap]: "Heatmap",
  [Viewing.Heatmap_Old]: "Heatmap (Old Colours)",
  [Viewing.Aggregate_Heatmap]: "Aggregate Heatmap",
  [Viewing.Water_Depth]: "Water Depth",
  [Viewing.Wind_Speed]: "Wind Speed",
  [Viewing.Bird_Risk]: "Bird Risk"
};

// ================ //
//     COMPONENT
// ================ //
/**
 * Drag-to-reorder list of the scenario's overlay layers, with a "Reset all
 * ranges" button and the fixed Base Layer card at the bottom. The top card is
 * drawn on top on the map.
 */
export default function LayerStack() {
  // # Context
  const { layers, setLayer, reorderLayers, viewing, baseLayer, setBaseLayer } =
    useScenarioContext();

  // # Sensors
  // pointer must move 4px before a drag starts (so plain clicks still work)
  // touch must be held 150ms (so the list can still be scrolled)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  // # Helper Functions
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    reorderLayers(active.id as LayerKey, over.id as LayerKey);
  };

  // # JSX
  return (
    <>
      {/* RESET (range + invert on every layer) */}
      <div className="layer-stack-toolbar">
        <Button
          size="compact-xs"
          variant="default"
          leftSection={<IconRefresh size={14} />}
          disabled={layers.every(isFullRange)}
          onClick={() =>
            layers.forEach((layer) => setLayer(layer.key)(fullRange(layer.key)))
          }
        >
          Reset all ranges
        </Button>
      </div>

      <div className="layer-stack">
        {/* SORTABLE LAYERS (top of list = drawn on top) */}
        <div className="layer-stack-sortable">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={layers.map((layer) => layer.key)}
              strategy={verticalListSortingStrategy}
            >
              {layers.map((layer) => (
                <SortableLayerCard
                  key={layer.key}
                  layer={layer}
                  onChange={setLayer(layer.key)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        {/* BASE LAYER (fixed at the bottom) */}
        <LayerCard
          name="Base Layer"
          info={VIEWING_LABELS[viewing]}
          baseLayer={baseLayer}
          onBaseChange={setBaseLayer}
        />
      </div>
    </>
  );
}

// ================== //
//  Sortable wrapper
// ================== //
interface SortableLayerCardProps {
  layer: Layer;
  onChange: (patch: Partial<Layer>) => void;
}

/**
 * Wraps a LayerCard with the drag-and-drop wiring that makes it sortable within
 * the LayerStack.
 */
function SortableLayerCard({ layer, onChange }: SortableLayerCardProps) {
  // # Sortable
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: layer.key });

  // # JSX
  return (
    <LayerCard
      name={LAYER_INFO[layer.key].name}
      layer={layer}
      onChange={onChange}
      cardRef={setNodeRef}
      handleRef={setActivatorNodeRef}
      style={{
        // lift the card while it's being dragged
        transform: `${CSS.Translate.toString(transform) ?? ""}${isDragging ? " scale(1.02)" : ""}`,
        transition
      }}
      dragging={isDragging}
      handleAttributes={attributes}
      handleListeners={listeners}
    />
  );
}
