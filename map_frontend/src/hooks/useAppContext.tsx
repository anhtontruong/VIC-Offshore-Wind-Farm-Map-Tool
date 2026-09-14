import { createContext, useContext, useState, type ReactNode } from "react";

import { INITIAL_CENTER, INITIAL_ZOOM } from "../constants/constants";

export const ScreenMode = {
  One_Screen: "ONE_SCREEN",
  Two_Screen: "TWO_SCREEN",
  Three_Screen: "THREE_SCREEN"
} as const;

type ScreenMode = (typeof ScreenMode)[keyof typeof ScreenMode];

type AppContextType = {
  screenmode: ScreenMode;
  setScreenmode: (state: ScreenMode) => void;
  center: [number, number];
  setCenter: (center: [number, number]) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
};

export const AppContext = createContext<AppContextType | null>(
  null
);

// =========================
//  CONTEXT HOOK (CONSUMER)
// =========================

export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error(
      "useScreenModeContext must be used within ScreenModeContext.Provider"
    );
  }

  return context;
}

type AppProviderProps = {
  children: ReactNode;
};

// ==========
//  PROVIDER
// ==========

export function AppProvider({ children }: AppProviderProps) {
  const [screenmode, setScreenmode] = useState<ScreenMode>(
    ScreenMode.One_Screen
  );

  const [center, setCenter] = useState<[number, number]>(INITIAL_CENTER);

  const [zoom, setZoom] = useState(INITIAL_ZOOM);

  return (
    <AppContext.Provider
      value={{
        screenmode,
        setScreenmode,
        center,
        setCenter,
        zoom,
        setZoom
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
