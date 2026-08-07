import { useState } from "react";
import "./App.css";
import Map from "./Map";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

function App() {
  

  return (
    <>
      <title>VIC Offshore Wind Farm Map Tool</title>
      <LeftBar />
      <Map />
    </>
  );
}

export default App;

// TODO: Extract to separate component
// TODO: Add slider
function LeftBar() {
  const [expanded, setExpanded] = useState(true);

  function handleClick() {
    console.log("Clicked")
    setExpanded((value) => !value);
  }

  return (<div className="left-bar">
    <div 
      className={`left-bar-container ${expanded
        ? "expanded" : "collapsed"
      }`}
    >
      CONTENT
    </div>
    <div className="left-bar-btn" onClick={handleClick}>
      {expanded
        ? <IconChevronLeft size={50} />
        : <IconChevronRight size={50} />}
    </div>
  </div>);
}

