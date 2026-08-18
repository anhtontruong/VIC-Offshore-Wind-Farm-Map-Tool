import { createContext, useContext, useState, type ReactNode } from "react";

type ScenarioContextType = {
  param1: number;
  setParam1: React.Dispatch<React.SetStateAction<number>>;
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
  const [param1, setParam1] = useState(0);

  return (
    <ScenarioContext.Provider
      value={{
        param1,
        setParam1
      }}
    >
      {children}
    </ScenarioContext.Provider>
  );
}
