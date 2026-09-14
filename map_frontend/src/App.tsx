import "./App.css";
import { MantineProvider, createTheme } from "@mantine/core";
import "@mantine/core/styles.css";

import "@fontsource/inter/300.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "@fontsource/inter/900.css";
import { ExpandedProvider } from "./hooks/useExpandedContext";
import { ScenarioProvider } from "./hooks/useScenarioContext";
import { AppProvider } from "./hooks/useAppContext";
import Scenario from "./components/Scenario";
import TopBar from "./components/TopBar";

const theme = createTheme({
  fontFamily: "Inter, sans-serif",
  headings: {
    fontWeight: "400"
  }
});

export default function App() {
  return (
    <MantineProvider theme={theme}>
      <title>VIC Offshore Wind Farm Map Tool</title>

      <AppProvider>

        <TopBar/>

        <ScenarioProvider>
          <ExpandedProvider>
            <Scenario/>
          </ExpandedProvider>
        </ScenarioProvider>

      </AppProvider>
    </MantineProvider>
  );
}
