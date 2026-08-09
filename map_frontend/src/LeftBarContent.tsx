import { Slider, Title } from "@mantine/core";

export default function LeftBarContent({}) {
  return (
    <div className="left-bar-content">
      <Title order={1} className="sub-heading">Parameters</Title>

      <Title order={6} className="name">Cost</Title>
      <Slider
        className="param-slider"
        restrictToMarks
        defaultValue={25}
        marks={Array.from({ length: 11 }).map((_, index) => ({
          value: index * 10
        }))}
      />

      {/* TODO: DRY, extract into reusable components */}
      <Title order={6} className="name">Param B</Title>
      <Slider
        className="param-slider"
        restrictToMarks
        defaultValue={25}
        marks={Array.from({ length: 11 }).map((_, index) => ({
          value: index * 10
        }))}
      />

    </div>
  );
}
