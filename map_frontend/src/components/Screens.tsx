import { useAppContext } from "../hooks/useAppContext";
import Scenario from "./Scenario";

export default function Screens() {
  const { screenMode } = useAppContext();

  const screenCount =
    screenMode === "ONE_SCREEN"
      ? 1
      : screenMode === "TWO_SCREEN"
        ? 2
        : 4;

  return (
    <>
      {Array.from({ length: screenCount }, (_, index) => (
        <Scenario key={index} />
      ))}
    </>
  );
}