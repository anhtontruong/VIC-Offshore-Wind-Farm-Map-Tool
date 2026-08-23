import { createContext, useContext, useState, type ReactNode } from "react";

type ScenarioContextType = {
  params: number[];
  getParam: (index: 0 | 1 | 2) => number;
  setParam: (index: 0 | 1 | 2) => (value: number) => void;
};

export const ScenarioContext = createContext<ScenarioContextType | null>(null);

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

export function ScenarioProvider({ children }: ScenarioProviderProps) {
  const [params, setParams] = useState<number[]>([0, 0, 0]);

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
        setParam
      }}
    >
      {children}
    </ScenarioContext.Provider>
  );
}
