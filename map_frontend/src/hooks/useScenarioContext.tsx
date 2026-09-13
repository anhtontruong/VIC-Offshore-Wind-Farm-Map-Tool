import type { Popup } from "mapbox-gl";
import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode
} from "react";

type ScenarioContextType = {
  params: number[];
  getParam: (index: 0 | 1 | 2) => number;
  setParam: (index: 0 | 1 | 2) => (value: number) => void;

  registerPopup: (popup: Popup) => void;
  unregisterPopup: (popup: Popup) => void;
  clearAllPopups: () => void;
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

  const popupsRef = useRef<Popup[]>([]);

  const getParam = (index: 0 | 1 | 2) => params[index];

  const setParam = (index: 0 | 1 | 2) => (value: number) => {
    setParams((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const registerPopup = (popup: Popup) => {
    popupsRef.current.push(popup);
  };

  const unregisterPopup = (popup: Popup) => {
    popupsRef.current = popupsRef.current.filter((p) => p !== popup);
  };

  const clearAllPopups = () => {
    popupsRef.current.forEach((popup) => popup.remove());
    popupsRef.current = [];
  };

  return (
    <ScenarioContext.Provider
      value={{
        params,
        getParam,
        setParam,
        registerPopup,
        unregisterPopup,
        clearAllPopups
      }}
    >
      {children}
    </ScenarioContext.Provider>
  );
}
