import Scenario from "./Scenario";
import { ScreenMode, useAppContext } from "../hooks/useAppContext";
import { ScenarioProvider } from "../hooks/useScenarioContext";
import { ExpandedProvider } from "../hooks/useExpandedContext";

// ================ //
//     COMPONENT
// ================ //
/**
 * GRID of side-by-side scenarios for the current screen mode. Renders one
 * Scenario per screen, each with its own state.
 */
export default function Screens() {
  // # Context
  const { screenMode } = useAppContext();

  // SCREEN COUNT
  const screenCount =
    screenMode === ScreenMode.One_Screen
      ? 1
      : screenMode === ScreenMode.Two_Screen
        ? 2
        : 4;

  // # JSX
  return (
    <div className={`map-grid ${screenMode}`}>
      {/* SCREENS (each with its own scenario + expanded state) */}
      {Array.from({ length: screenCount }, (_, index) => (
        <ScenarioProvider key={index}>
          <ExpandedProvider>
            <Scenario />
          </ExpandedProvider>
        </ScenarioProvider>
      ))}
    </div>
  );
}
