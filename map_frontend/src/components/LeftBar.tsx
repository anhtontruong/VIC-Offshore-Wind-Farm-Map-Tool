import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import LeftBarContent from "./LeftBarContent";
import { useExpandedContext } from "../hooks/useExpandedContext";
import { useAppContext } from "../hooks/useAppContext";

// ================ //
//     COMPONENT
// ================ //
/**
 * Collapsible side panel of a scenario. Wraps the LeftBarContent and the
 * chevron button that expands or collapses it.
 */
export default function LeftBar() {
  // # Context
  const { expanded, toggleExpanded } = useExpandedContext();
  const { uiHidden } = useAppContext();

  // # JSX
  return (
    <div className={`left-bar ${uiHidden ? "ui-hidden" : ""}`}>
      {/* CONTENT */}
      <div
        className={`left-bar-container ${expanded ? "expanded" : "collapsed"}`}
      >
        <LeftBarContent />
      </div>
      {/* EXPAND / COLLAPSE BUTTON */}
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
