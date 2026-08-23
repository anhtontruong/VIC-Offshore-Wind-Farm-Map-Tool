import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import LeftBarContent from "./LeftBarContent";
import { useExpandedContext } from "../hooks/useExpandedContext";

export default function LeftBar() {
  const { expanded, toggleExpanded } = useExpandedContext();

  return (
    <div className="left-bar">
      <div
        className={`left-bar-container ${expanded ? "expanded" : "collapsed"}`}
      >
        <LeftBarContent />
      </div>
      <div className="left-bar-btn" onClick={toggleExpanded}>
        {expanded ? (
          <IconChevronLeft size={50} />
        ) : (
          <IconChevronRight size={50} />
        )}
      </div>
    </div>
  );
}
