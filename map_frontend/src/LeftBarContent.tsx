import { Slider, Title } from "@mantine/core";
import { useScenarioContext } from "./useScenarioContext";

export default function LeftBarContent() {
  const { param1, setParam1 } = useScenarioContext();

  return (
    <div className="left-bar-content">
      <Title order={1} className="sub-heading">Parameters</Title>

      <Title order={6} className="name">Cost</Title>
      <Slider
        className="param-slider"
        restrictToMarks
        defaultValue={0}
        marks={Array.from({ length: 11 }).map((_, index) => ({
          value: index * 10
        }))}
        value={param1}
        onChange={setParam1}
      />

      {/* TODO: DRY, extract into reusable components */}
      <Title order={6} className="name">Param B</Title>
      <Slider
        className="param-slider"
        restrictToMarks
        defaultValue={40}
        marks={Array.from({ length: 11 }).map((_, index) => ({
          value: index * 10
        }))}
      />

    </div>
  );
}
