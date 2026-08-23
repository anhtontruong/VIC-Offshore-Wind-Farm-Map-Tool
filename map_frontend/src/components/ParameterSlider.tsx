import { Slider, Title } from "@mantine/core";
import { useExpandedContext } from "../hooks/useExpandedContext";

interface ParameterSliderProps {
  name: string;
  param: number;
  setParam: (value: number) => void;
}

export default function ParameterSlider({
  name,
  param,
  setParam
}: ParameterSliderProps) {
  const { expanded } = useExpandedContext();

  return (
    <div className="slider">
      <Title
        order={6}
        className={`name ${expanded ? "expanded" : "collapsed"}`}
      >
        {name}
      </Title>
      <div className="slider-flex">
        <div className="param-slider">
          <Slider min={0} max={1} step={0.1} value={param} onChange={setParam} />
        </div>
        <b className="slider-value">{param}</b>
      </div>
    </div>
  );
}
