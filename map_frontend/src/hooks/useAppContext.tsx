import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
  type RefObject
} from "react";

import { INITIAL_CENTER, INITIAL_ZOOM } from "../constants/constants";

export const ScreenMode = {
  One_Screen: "ONE_SCREEN",
  Two_Screen: "TWO_SCREEN",
  Three_Screen: "THREE_SCREEN"
} as const;

type ScreenMode = (typeof ScreenMode)[keyof typeof ScreenMode];

// Cell user clicked, shared by every screen
export type OpenCell = {
  id: number;
  lngLat: [number, number]; // exact click point, used as popup anchor
  props: Record<string, any>; // properties with all slider weightings
};

type AppContextType = {
  screenMode: ScreenMode;
  setScreenMode: (state: ScreenMode) => void;
  uiHidden: boolean;
  setUiHidden: (value: boolean) => void;
  center: [number, number];
  setCenter: (center: [number, number]) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  cameraOwnerRef: RefObject<string | null>; // id of the screen driving the shared camera
  hoveredCellId: number | null;
  setHoveredCellId: (id: number | null) => void;
  selectedCellId: number | null;
  setSelectedCellId: (id: number | null) => void;
  openCells: OpenCell[];
  openCell: (cell: OpenCell) => void;
  closeCell: (id: number) => void;
  clearAllPopups: () => void;
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
  const [screenMode, setScreenMode] = useState<ScreenMode>(
    ScreenMode.One_Screen
  );

  const [uiHidden, setUiHidden] = useState(false);

  const [center, setCenter] = useState<[number, number]>(INITIAL_CENTER);

  const [zoom, setZoom] = useState(INITIAL_ZOOM);

  // a ref, not state: read synchronously inside map event handlers
  const cameraOwnerRef = useRef<string | null>(null);

  const [hoveredCellId, setHoveredCellId] = useState<number | null>(null);

  const [selectedCellId, setSelectedCellId] = useState<number | null>(null);

  const [openCells, setOpenCells] = useState<OpenCell[]>([]);

  const openCell = (cell: OpenCell) =>
    setOpenCells((prev) =>
      prev.some((c) => c.id === cell.id) ? prev : [...prev, cell]
    );

  const closeCell = (id: number) => {
    setOpenCells((prev) =>
      prev.some((c) => c.id === id) ? prev.filter((c) => c.id !== id) : prev
    );
    setSelectedCellId((prev) => (prev === id ? null : prev));
  };

  const clearAllPopups = () => {
    setOpenCells([]);
    setSelectedCellId(null);
  };

  return (
    <AppContext.Provider
      value={{
        screenMode,
        setScreenMode,
        uiHidden,
        setUiHidden,
        center,
        setCenter,
        zoom,
        setZoom,
        cameraOwnerRef,
        hoveredCellId,
        setHoveredCellId,
        selectedCellId,
        setSelectedCellId,
        openCells,
        openCell,
        closeCell,
        clearAllPopups
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
