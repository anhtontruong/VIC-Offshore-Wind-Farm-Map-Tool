import { Slider, Title } from "@mantine/core";

interface ParameterSliderProps {
  name: string;
  param: number;
  setParam: (value: number) => void;
}

export default function ParameterSlider({ name, param, setParam }: ParameterSliderProps) {
  return (
    <div>
      <Title order={6} className="name">
        {name}
      </Title>
      <Slider
        className="param-slider"
        restrictToMarks
        defaultValue={0}
        marks={Array.from({
          length: 11
        }).map((_, index) => ({
          value: index * 10
        }))}
        value={param}
        onChange={setParam}
      />
    </div>
  );
}
