import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import LeftBarContent from "./LeftBarContent";
import { useExpandedContext } from "../hooks/useExpandedContext";
import { useAppContext } from "../hooks/useAppContext";

export default function LeftBar() {
  const { expanded, toggleExpanded } = useExpandedContext();
  const { uiHidden } = useAppContext();

  return (
    <div className={`left-bar ${uiHidden ? "ui-hidden" : ""}`}>
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
