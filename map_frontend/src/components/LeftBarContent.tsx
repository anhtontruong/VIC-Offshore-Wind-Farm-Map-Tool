import { Title } from "@mantine/core";
import { useScenarioContext } from "../hooks/useScenarioContext";
import ParameterSlider from "./ParameterSlider";

export default function LeftBarContent() {
  const { getParam, setParam } = useScenarioContext();

  console.log(`A: ${getParam(0)} B: ${getParam(1)} A: ${getParam(2)}`);

  return (
    <div className="left-bar-content">
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
    </div>
  );
}
