import { Button, ScrollArea, Title } from "@mantine/core";
import { useScenarioContext, Viewing } from "../hooks/useScenarioContext";
import ParameterSlider from "./ParameterSlider";
import LayerStack from "./LayerStack";
import { useExpandedContext } from "../hooks/useExpandedContext";
import { ScreenMode, useAppContext } from "../hooks/useAppContext";
import { useEffect, useRef } from "react";

// ================ //
//     COMPONENT
// ================ //
/**
 * Scrollable contents of the left bar: the three parameter weight sliders with
 * their sum-to-one check (Parameters A + B in 1 Screen Aggregate (2 Scenarios)),
 * the buttons that choose which data the map shows, and the Layer Stack.
 */
export default function LeftBarContent() {
  // # Context
  const {
    getParam,
    setParam,
    params,
    getParamB,
    setParamB,
    paramsB,
    viewing,
    setViewing
  } = useScenarioContext();
  const { expanded } = useExpandedContext();
  const { clearAllPopups, screenMode } = useAppContext();
  const isAggregate2 = screenMode === ScreenMode.One_Screen_Aggregate_2;

  // clears popups on every screen, but not on mount (otherwise split screen wipes popups)
  // also on entering/leaving aggregate mode, as popups show capacity for A (+ B)
  const paramsKey = [...params, ...paramsB, isAggregate2].join(",");
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    clearAllPopups();
  }, [paramsKey]);

  // Heatmap (+ Old Colour) only outside aggregate mode, Aggregate Heatmap (2) only in it
  useEffect(() => {
    if (
      isAggregate2 &&
      (viewing === Viewing.Heatmap || viewing === Viewing.Heatmap_Old)
    ) {
      setViewing(Viewing.Aggregate_Heatmap_2);
    } else if (!isAggregate2 && viewing === Viewing.Aggregate_Heatmap_2) {
      setViewing(Viewing.Heatmap);
    }
  }, [isAggregate2]);

  // # JSX
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
          {/* PARAMETERS (A + B in aggregate mode) */}
          {isAggregate2 ? (
            <>
              <ParameterSection
                title="Parameters A"
                getParam={getParam}
                setParam={setParam}
              />
              <div className="section-divider" />
              <ParameterSection
                title="Parameters B"
                getParam={getParamB}
                setParam={setParamB}
              />
            </>
          ) : (
            <ParameterSection
              title="Parameters"
              getParam={getParam}
              setParam={setParam}
            />
          )}

          <div className="section-divider" />

          {/* DATA (what the base layer of the map shows) */}
          <div className="data-section">
            <Title order={1} className="sub-heading">
              Data
            </Title>

            <div className="data-buttons">
              {isAggregate2 ? (
                <Button
                  className="data-button"
                  variant={
                    viewing === Viewing.Aggregate_Heatmap_2 ? "filled" : "light"
                  }
                  onClick={() => setViewing(Viewing.Aggregate_Heatmap_2)}
                >
                  Aggregate Heatmap (2)
                </Button>
              ) : (
                <>
                  <Button
                    className="data-button"
                    variant={viewing === Viewing.Heatmap ? "filled" : "light"}
                    onClick={() => setViewing(Viewing.Heatmap)}
                  >
                    Heatmap
                  </Button>

                  <Button
                    className="data-button"
                    variant={
                      viewing === Viewing.Heatmap_Old ? "filled" : "light"
                    }
                    onClick={() => setViewing(Viewing.Heatmap_Old)}
                  >
                    Heatmap (Old Colour)
                  </Button>
                </>
              )}

              <Button
                className="data-button"
                variant={
                  viewing === Viewing.Aggregate_Heatmap ? "filled" : "light"
                }
                onClick={() => setViewing(Viewing.Aggregate_Heatmap)}
              >
                Aggregate Heatmap (All)
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
          </div>

          <div className="section-divider" />

          {/* LAYER STACK */}
          <Title order={1} className="sub-heading">
            Layer Stack
          </Title>
          <LayerStack />
        </div>
      </ScrollArea>
    </div>
  );
}

// =================== //
//  Parameter Section
// =================== //
interface ParameterSectionProps {
  title: string;
  getParam: (index: 0 | 1 | 2) => number;
  setParam: (index: 0 | 1 | 2) => (value: number) => void;
}

/**
 * One set of parameters: the three weight sliders with their sum-to-one check.
 */
function ParameterSection({ title, getParam, setParam }: ParameterSectionProps) {
  const sum = getParam(0) + getParam(1) + getParam(2);

  // # JSX
  return (
    <>
      <Title order={1} className="sub-heading">
        {title}
      </Title>

      <ParameterSlider
        name="Total Lifetime Cost"
        info="Minimisation Weight"
        param={getParam(0)}
        setParam={setParam(0)}
        sum={sum}
      />

      <ParameterSlider
        name="Seabird Exposure"
        info="Minimisation Weight"
        param={getParam(1)}
        setParam={setParam(1)}
        sum={sum}
      />

      <ParameterSlider
        name="Annual Wind Energy Production"
        info="Maximisation Weight"
        param={getParam(2)}
        setParam={setParam(2)}
        sum={sum}
      />

      {/* SUM CHECK */}
      <div className={`nomp sum-one-status ${sum === 1 ? "valid" : "invalid"}`}>
        <p>
          <b>{sum.toFixed(2)}</b> {sum === 1 ? "=" : sum > 1 ? ">" : "<"} 1
        </p>
      </div>

      <div className="sum-one-message">
        SUM OF ALL THREE WEIGHTS <b>MUST EQUAL</b> TO 1
      </div>
    </>
  );
}
