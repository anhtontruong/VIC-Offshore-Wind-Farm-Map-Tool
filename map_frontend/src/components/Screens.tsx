import Scenario from "./Scenario";
import { ScreenMode, useAppContext } from "../hooks/useAppContext";
import { ScenarioProvider } from "../hooks/useScenarioContext";
import { ExpandedProvider } from "../hooks/useExpandedContext";

export default function Screens() {
  const { screenMode } = useAppContext();

  const screenCount =
    screenMode === ScreenMode.One_Screen
      ? 1
      : screenMode === ScreenMode.Two_Screen
        ? 2
        : 4;

  return (
    <div className={`map-grid ${screenMode}`}>
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
