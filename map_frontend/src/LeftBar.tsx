import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

interface LeftBarProps {
  expanded: boolean;
  setExpanded: React.Dispatch<React.SetStateAction<boolean>>;
}

// TODO: Add slider
export default function LeftBar({ expanded, setExpanded }: LeftBarProps) {
  function handleClick() {
    console.log("Clicked");
    setExpanded((value) => !value);
  }

  return (
    <div className="left-bar">
      <div
        className={`left-bar-container ${expanded ? "expanded" : "collapsed"}`}
      >
        CONTENT
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
