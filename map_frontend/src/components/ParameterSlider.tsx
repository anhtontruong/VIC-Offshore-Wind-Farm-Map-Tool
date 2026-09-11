import { Slider, Title } from "@mantine/core";
import { useExpandedContext } from "../hooks/useExpandedContext";
import { useScenarioContext } from "../hooks/useScenarioContext";

interface ParameterSliderProps {
  name: string;
  info: string;
  param: number;
  setParam: (value: number) => void;
}

export default function ParameterSlider({
  name,
  info,
  param,
  setParam
}: ParameterSliderProps) {
  const { expanded } = useExpandedContext();
  const { getParam } = useScenarioContext();

  const currentSum = getParam(0) + getParam(1) + getParam(2);
  const isSumToOne = Math.abs(currentSum - 1) < 1e-10;

  return (
    <div className="slider">
      <Title
        order={5}
        className={`name ${expanded ? "content-expanded" : "content-collapsed"}`}
      >
        {name}
      </Title>
      <Title
        size={12}
        c={"grey"}
        className={`name ${expanded ? "content-expanded" : "content-collapsed"}`}
      >
        <i>{info}</i>
      </Title>
      <div className="slider-flex">
        <div className="param-slider">
          <Slider
            domain={[0, 1]}
            min={0}
            max={1 - currentSum + param}
            step={1 / 3}
            marks={[
              { value: 1 - currentSum + param, label: "limit" },
              { value: 1 / 3 },
              { value: 2 / 3 },
            ]}
            value={param}
            label={(value) => value.toFixed(2)}
            onChange={setParam}
          />
        </div>
        <p className={`nomp slider-value ${isSumToOne ? "" : "invalid"}`}>
          {param.toFixed(2)}
        </p>
      </div>
    </div>
  );
}
