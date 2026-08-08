import { useState } from "react";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

// TODO: Extract to separate component
// TODO: Add slider
export default function LeftBar() {
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
