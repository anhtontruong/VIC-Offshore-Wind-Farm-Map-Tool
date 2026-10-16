import { Slider, Title } from "@mantine/core";
import { useExpandedContext } from "../hooks/useExpandedContext";

interface ParameterSliderProps {
  name: string;
  info: string;
  param: number;
  setParam: (value: number) => void;
  sum: number; // sum of all three weights in this slider's parameter set
}

// ================ //
//     COMPONENT
// ================ //
/**
 * Labelled slider for one of the three scenario weights. Its maximum is limited
 * so the weights can never sum to more than 1.
 */
export default function ParameterSlider({
  name,
  info,
  param,
  setParam,
  sum: currentSum
}: ParameterSliderProps) {
  // # Context
  const { expanded } = useExpandedContext();

  // SUM CHECK
  // tolerance absorbs the float error from the 1/3 steps
  const isSumToOne = Math.abs(currentSum - 1) < 1e-10;

  // # JSX
  return (
    <div className="slider">
      {/* NAME */}
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
      {/* SLIDER */}
      <div className="slider-flex">
        <div className="param-slider">
          <Slider
            domain={[0, 1]}
            min={0}
            // max = what's left once the other two weights are taken
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
        {/* VALUE */}
        <p className={`nomp slider-value ${isSumToOne ? "" : "invalid"}`}>
          {param.toFixed(2)}
        </p>
      </div>
    </div>
  );
}
