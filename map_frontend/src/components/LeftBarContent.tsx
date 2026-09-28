import { Button, ScrollArea, Title } from "@mantine/core";
import { useScenarioContext, Viewing } from "../hooks/useScenarioContext";
import ParameterSlider from "./ParameterSlider";
import LayerStack from "./LayerStack";
import { useExpandedContext } from "../hooks/useExpandedContext";
import { useAppContext } from "../hooks/useAppContext";
import { useEffect, useRef } from "react";

export default function LeftBarContent() {
  const { getParam, setParam, params, viewing, setViewing } =
    useScenarioContext();
  const sum = getParam(0) + getParam(1) + getParam(2);
  const { expanded } = useExpandedContext();
  const { clearAllPopups } = useAppContext();

  // Clear all popups (in every screen) when changing scenario but not on mount (otherwise split screen wipes popups)
  const paramsKey = params.join(",");
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    clearAllPopups();
  }, [paramsKey]);

  return (
    <div
      className={`left-bar-content ${
        expanded ? "content-expanded" : "content-collapsed"
      }`}
    >
      <ScrollArea
        className="left-bar-scroll"
        type="always"
        offsetScrollbars
        scrollbarSize={8}
        scrollbars="y"
      >
        <div className="left-bar-inner">
          <Title order={1} className="sub-heading">
            Parameters
          </Title>

          <ParameterSlider
            name="Total Lifetime Cost"
            info="Minimisation Weight"
            param={getParam(0)}
            setParam={setParam(0)}
          />

          <ParameterSlider
            name="Seabird Exposure"
            info="Minimisation Weight"
            param={getParam(1)}
            setParam={setParam(1)}
          />

          <ParameterSlider
            name="Annual Wind Energy Production"
            info="Maximisation Weight"
            param={getParam(2)}
            setParam={setParam(2)}
          />

          <div
            className={`nomp sum-one-status ${sum === 1 ? "valid" : "invalid"}`}
          >
            <p>
              <b>{sum.toFixed(2)}</b> {sum === 1 ? "=" : sum > 1 ? ">" : "<"} 1
            </p>
          </div>

          <div className="sum-one-message">
            SUM OF ALL THREE WEIGHTS <b>MUST EQUAL</b> TO 1
          </div>

          <div className="section-divider" />

          <Title order={1} className="sub-heading">
            Data
          </Title>

          <div className="data-buttons">
            <Button
              className="data-button"
              variant={viewing === Viewing.Heatmap ? "filled" : "light"}
              onClick={() => setViewing(Viewing.Heatmap)}
            >
              Heatmap
            </Button>

            <Button
              className="data-button"
              variant={viewing === Viewing.Water_Depth ? "filled" : "light"}
              onClick={() => setViewing(Viewing.Water_Depth)}
            >
              Water Depth
            </Button>

            <Button
              className="data-button"
              variant={viewing === Viewing.Wind_Speed ? "filled" : "light"}
              onClick={() => setViewing(Viewing.Wind_Speed)}
            >
              Wind Speed
            </Button>

            <Button
              className="data-button"
              variant={viewing === Viewing.Bird_Risk ? "filled" : "light"}
              onClick={() => setViewing(Viewing.Bird_Risk)}
            >
              Bird Risk
            </Button>
          </div>

          <div className="section-divider" />

          <Title order={1} className="sub-heading">
            Layer Stack
          </Title>
          <LayerStack />
        </div>
      </ScrollArea>
    </div>
  );
}
