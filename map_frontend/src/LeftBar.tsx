import { Title } from "@mantine/core";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

interface LeftBarProps {
  expanded: boolean;
  setExpanded: React.Dispatch<React.SetStateAction<boolean>>;
}

// TODO: Add slider
export default function LeftBar({ expanded, setExpanded }: LeftBarProps) {
  function handleClick() {
    setExpanded((value) => !value);
  }

  return (
    <div className="left-bar">
      <div
        className={`left-bar-container ${expanded ? "expanded" : "collapsed"}`}
      >
        
        <div className="left-bar-content">
          <Title order={2}>
            Parameters
          </Title>
        </div>

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
