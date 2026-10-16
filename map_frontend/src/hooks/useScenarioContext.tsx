import {
  createContext,
  useContext,
  useState,
  type ReactNode
} from "react";
import { arrayMove } from "@dnd-kit/sortable";
import {
  BASE_LAYER_OPACITY,
  LAYER_INFO,
  LAYER_KEYS,
  LAYER_OPACITY,
  type LayerKey
} from "../constants/constants";

export const Viewing = {
  Heatmap: "HEATMAP",
  Heatmap_Old: "HEATMAP_OLD",
  Aggregate_Heatmap: "AGGREGATE_HEATMAP",
  Aggregate_Heatmap_2: "AGGREGATE_HEATMAP_2", // only in 1 Screen Aggregate (2 Scenarios)
  Water_Depth: "WATER_DEPTH",
  Wind_Speed: "WIND_SPEED",
  Bird_Risk: "BIRD_RISK"
} as const;

export type Viewing = (typeof Viewing)[keyof typeof Viewing];

export type Layer = {
  key: LayerKey;
  range: [number, number];
  opacity: number;
  visible: boolean;
  inverted: boolean;
  masking: boolean;
};

// controls on the fixed Base Layer card
export type BaseLayer = {
  opacity: number;
  fill: boolean; // cell fill colour shown
  solutionOutline: boolean; // thick outline on cells with a solution (> 0 MW)
};

// full range + not inverted (what the layer stack reset buttons restore)
export const fullRange = (
  key: LayerKey
): Pick<Layer, "range" | "inverted"> => ({
  range: [LAYER_INFO[key].min, LAYER_INFO[key].max],
  inverted: false
});

export const isFullRange = (layer: Layer) =>
  !layer.inverted &&
  layer.range[0] === LAYER_INFO[layer.key].min &&
  layer.range[1] === LAYER_INFO[layer.key].max;

type ScenarioContextType = {
  params: number[];
  getParam: (index: 0 | 1 | 2) => number;
  setParam: (index: 0 | 1 | 2) => (value: number) => void;
  // Parameters B (only used in 1 Screen Aggregate (2 Scenarios), params above are A)
  paramsB: number[];
  getParamB: (index: 0 | 1 | 2) => number;
  setParamB: (index: 0 | 1 | 2) => (value: number) => void;
  viewing: Viewing;
  setViewing: (state: Viewing) => void;
  layers: Layer[]; // top -> bottom, base heatmap is implicit below
  setLayer: (key: LayerKey) => (patch: Partial<Layer>) => void;
  reorderLayers: (fromKey: LayerKey, toKey: LayerKey) => void;
  baseLayer: BaseLayer;
  setBaseLayer: (patch: Partial<BaseLayer>) => void;
};

export const ScenarioContext = createContext<ScenarioContextType | null>(null);

// =========================
//  CONTEXT HOOK (CONSUMER)
// =========================

export function useScenarioContext() {
  const context = useContext(ScenarioContext);

  if (!context) {
    throw new Error(
      "useScenarioContext must be used within ScenarioContext.Provider"
    );
  }

  return context;
}

type ScenarioProviderProps = {
  children: ReactNode;
};

// ==========
//  PROVIDER
// ==========

export function ScenarioProvider({ children }: ScenarioProviderProps) {
  const [params, setParams] = useState<number[]>([1, 0, 0]);
  const [paramsB, setParamsB] = useState<number[]>([1, 0, 0]);
  const [viewing, setViewing] = useState<Viewing>(Viewing.Heatmap);
  const [layers, setLayers] = useState<Layer[]>(() =>
    LAYER_KEYS.map((key) => ({
      key,
      range: [LAYER_INFO[key].min, LAYER_INFO[key].max],
      opacity: LAYER_OPACITY,
      visible: false,
      inverted: false,
      masking: false
    }))
  );
  const [baseLayer, setBaseLayerState] = useState<BaseLayer>({
    opacity: BASE_LAYER_OPACITY,
    fill: true,
    solutionOutline: false
  });

  const getParam = (index: 0 | 1 | 2) => params[index];

  const setParam = (index: 0 | 1 | 2) => (value: number) => {
    setParams((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const getParamB = (index: 0 | 1 | 2) => paramsB[index];

  const setParamB = (index: 0 | 1 | 2) => (value: number) => {
    setParamsB((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const setLayer = (key: LayerKey) => (patch: Partial<Layer>) => {
    setLayers((prev) =>
      prev.map((layer) => (layer.key === key ? { ...layer, ...patch } : layer))
    );
  };

  const reorderLayers = (fromKey: LayerKey, toKey: LayerKey) => {
    setLayers((prev) =>
      arrayMove(
        prev,
        prev.findIndex((layer) => layer.key === fromKey),
        prev.findIndex((layer) => layer.key === toKey)
      )
    );
  };

  const setBaseLayer = (patch: Partial<BaseLayer>) => {
    setBaseLayerState((prev) => ({ ...prev, ...patch }));
  };

  return (
    <ScenarioContext.Provider
      value={{
        params,
        getParam,
        setParam,
        paramsB,
        getParamB,
        setParamB,
        viewing,
        setViewing,
        layers,
        setLayer,
        reorderLayers,
        baseLayer,
        setBaseLayer
      }}
    >
      {children}
    </ScenarioContext.Provider>
  );
}
