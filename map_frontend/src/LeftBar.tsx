import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import LeftBarContent from "./LeftBarContent";

interface LeftBarProps {
  expanded: boolean;
  setExpanded: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function LeftBar({ expanded, setExpanded }: LeftBarProps) {
  function handleClick() {
    setExpanded((value) => !value);
  }

  return (
    <div className="left-bar">
      <div
        className={`left-bar-container ${expanded ? "expanded" : "collapsed"}`}
      >
        <LeftBarContent />
      </div>
      <div className="left-bar-btn" onClick={handleClick}>
        {expanded ? (
          <IconChevronLeft size={50} />
        ) : (
          <IconChevronRight size={50} />
        )}
      </div>
    </div>
  );
}
