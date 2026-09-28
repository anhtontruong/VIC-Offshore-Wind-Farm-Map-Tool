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
import LayerCard from "./LayerCard";
import {
  useScenarioContext,
  Viewing,
  type Layer
} from "../hooks/useScenarioContext";
import { LAYER_INFO, type LayerKey } from "../constants/constants";
import { useExpandedContext } from "../hooks/useExpandedContext";

const VIEWING_LABELS: Record<Viewing, string> = {
  [Viewing.Heatmap]: "Heatmap",
  [Viewing.Water_Depth]: "Water Depth",
  [Viewing.Wind_Speed]: "Wind Speed",
  [Viewing.Bird_Risk]: "Bird Risk"
};

export default function LayerStack() {
  const { layers, setLayer, reorderLayers, viewing } = useScenarioContext();
  const { expanded } = useExpandedContext();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    reorderLayers(active.id as LayerKey, over.id as LayerKey);
  };

  return (
    <>
      <div className="layer-stack">
        {/* sortable layers (top of list = drawn on top) */}
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

        {/* base layer, fixed at the bottom */}
        <LayerCard name="Base Layer" info={VIEWING_LABELS[viewing]} />
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

function SortableLayerCard({ layer, onChange }: SortableLayerCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: layer.key });

  return (
    <LayerCard
      name={LAYER_INFO[layer.key].name}
      layer={layer}
      onChange={onChange}
      cardRef={setNodeRef}
      handleRef={setActivatorNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      dragging={isDragging}
      handleAttributes={attributes}
      handleListeners={listeners}
    />
  );
}
