import {
  createContext,
  useContext,
  useState,
  type ReactNode
} from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { LAYER_INFO, LAYER_KEYS, type LayerKey } from "../constants/constants";

export const Viewing = {
  Heatmap: "HEATMAP",
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

type ScenarioContextType = {
  params: number[];
  getParam: (index: 0 | 1 | 2) => number;
  setParam: (index: 0 | 1 | 2) => (value: number) => void;
  viewing: Viewing;
  setViewing: (state: Viewing) => void;
  layers: Layer[]; // top -> bottom, base heatmap is implicit below
  setLayer: (key: LayerKey) => (patch: Partial<Layer>) => void;
  reorderLayers: (fromKey: LayerKey, toKey: LayerKey) => void;
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
  const [viewing, setViewing] = useState<Viewing>(Viewing.Heatmap);
  const [layers, setLayers] = useState<Layer[]>(() =>
    LAYER_KEYS.map((key) => ({
      key,
      range: [LAYER_INFO[key].min, LAYER_INFO[key].max],
      opacity: 0.3,
      visible: false,
      inverted: false,
      masking: false
    }))
  );

  const getParam = (index: 0 | 1 | 2) => params[index];

  const setParam = (index: 0 | 1 | 2) => (value: number) => {
    setParams((prev) => {
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

  return (
    <ScenarioContext.Provider
      value={{
        params,
        getParam,
        setParam,
        viewing,
        setViewing,
        layers,
        setLayer,
        reorderLayers
      }}
    >
      {children}
    </ScenarioContext.Provider>
  );
}
