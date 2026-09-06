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

  const isSumToOne = getParam(0) + getParam(1) + getParam(2) === 1;

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
            min={0}
            max={1}
            step={0.1}
            value={param}
            onChange={setParam}
          />
        </div>
        <p className={`nomp slider-value ${isSumToOne ? "" : "invalid"}`}>
          {param}
        </p>
      </div>
    </div>
  );
}
