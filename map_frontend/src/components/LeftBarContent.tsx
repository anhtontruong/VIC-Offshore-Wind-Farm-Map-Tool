import { Title } from "@mantine/core";
import { useScenarioContext } from "../hooks/useScenarioContext";
import ParameterSlider from "./ParameterSlider";
import { useExpandedContext } from "../hooks/useExpandedContext";

export default function LeftBarContent() {
  const { getParam, setParam } = useScenarioContext();
  const sum = getParam(0) + getParam(1) + getParam(2);
  const { expanded } = useExpandedContext();

  return (
    <div className={`left-bar-content ${expanded ? "content-expanded" : "content-collapsed"}`}>
      <Title order={1} className="sub-heading">
        Parameters
      </Title>

      <ParameterSlider
        name={"Cost Minimisation Weight"}
        param={getParam(0)}
        setParam={setParam(0)}
      />

      <ParameterSlider
        name={"Bird Impact Minimisation Weight"}
        param={getParam(1)}
        setParam={setParam(1)}
      />

      <ParameterSlider
        name={"Wind Energy Generation Maximisation Weight"}
        param={getParam(2)}
        setParam={setParam(2)}
      />

      <div
        className={`nomp sum-one-status ${sum === 1 ? "valid" : "invalid"} ${expanded ? "content-expanded" : "content-collapsed"}`}
      >
        <p>
          <b>{sum.toFixed(1)}</b> {sum === 1 ? "=" : sum > 1 ? ">" : "<"} 1
        </p>
      </div>
    </div>
  );
}
