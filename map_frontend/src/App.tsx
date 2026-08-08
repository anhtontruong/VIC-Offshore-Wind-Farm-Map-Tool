import { useState } from "react";
import "./App.css";
import LeftBar from "./LeftBar";
import Map from "./Map";

function App() {
  const [expanded, setExpanded] = useState(true);

  return (
    <>
      <title>VIC Offshore Wind Farm Map Tool</title>
      <LeftBar expanded={expanded} setExpanded={setExpanded}/>
      <Map expanded={expanded}/>
    </>
  );
}

export default App;
