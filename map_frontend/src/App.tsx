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
import { AppProvider } from "./hooks/useAppContext";
import TopBar from "./components/TopBar";
import Screens from "./components/Screens";

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
        <TopBar />

        <Screens/>
      </AppProvider>
    </MantineProvider>
  );
}
