import {
  createContext,
  useContext,
  useState,
  type ReactNode
} from "react";

export const Viewing = {
  Heatmap: "HEATMAP",
  Water_Depth: "WATER_DEPTH",
  Wind_Speed: "WIND_SPEED",
  Bird_Risk: "BIRD_RISK"
} as const;

type Viewing = (typeof Viewing)[keyof typeof Viewing];

type ScenarioContextType = {
  params: number[];
  getParam: (index: 0 | 1 | 2) => number;
  setParam: (index: 0 | 1 | 2) => (value: number) => void;
  viewing: Viewing;
  setViewing: (state: Viewing) => void;
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

  const getParam = (index: 0 | 1 | 2) => params[index];

  const setParam = (index: 0 | 1 | 2) => (value: number) => {
    setParams((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  return (
    <ScenarioContext.Provider
      value={{
        params,
        getParam,
        setParam,
        viewing,
        setViewing
      }}
    >
      {children}
    </ScenarioContext.Provider>
  );
}
