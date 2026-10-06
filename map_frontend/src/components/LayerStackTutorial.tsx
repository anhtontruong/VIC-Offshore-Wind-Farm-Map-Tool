import { Modal } from "@mantine/core";
import {
  IconEye,
  IconEyeOff,
  IconGripVertical,
  IconMask,
  IconRefresh,
  IconSquareToggle
} from "@tabler/icons-react";
import type { ReactNode } from "react";

// em so the icons scale with the popup text (see .tutorial in App.css)
const ICON_SIZE = "1.2em";

// same icons as the layer cards (LayerCard.tsx)
const CONTROLS: { icon: ReactNode; name: string; text: string }[] = [
  {
    icon: (
      <>
        <IconEye size={ICON_SIZE} />
        <IconEyeOff size={ICON_SIZE} />
      </>
    ),
    name: "Hide / Show layer",
    text: "Turns the layer on or off on the map."
  },
  {
    icon: <IconSquareToggle size={ICON_SIZE} />,
    name: "Invert range",
    text: "Selects everything outside the range instead of inside it."
  },
  {
    icon: <IconMask size={ICON_SIZE} />,
    name: "Mask out layers below",
    text: "Hides the selected cells on every layer below, including the Base Layer."
  },
  {
    icon: <IconGripVertical size={ICON_SIZE} />,
    name: "Reorder",
    text: "Drag a card up or down to change the draw order."
  },
  {
    icon: <IconRefresh size={ICON_SIZE} color="var(--mantine-color-red-6)" />,
    name: "Reset range",
    text: "Restores the layer's full range and turns Invert off."
  },
  {
    icon: <IconRefresh size={ICON_SIZE} />,
    name: "Reset all ranges",
    text: "Does the same for every layer at once."
  }
];

// step n uses public/images/LayerStack{n}.webp + Map{n}.webp
// highlight = leading word(s) of the title given the yellow marker
const STEPS = [
  { title: "Selecting Range", highlight: "Selecting" },
  { title: "Inverting Range", highlight: "Inverting" },
  { title: "Mask Out Layers", highlight: "Mask" },
  { title: "Updating Range Endpoints", highlight: "" }
];

interface LayerStackTutorialProps {
  opened: boolean;
  onClose: () => void;
}

export default function LayerStackTutorial({
  opened,
  onClose
}: LayerStackTutorialProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      title="Layer Stack Tutorial"
      // as wide as a 16:9 box at 88% of the window, height ends at the content
      // (wrapped in calc() so Mantine passes it through as-is)
      size="calc(min(88vw, 88vh * 16 / 9))"
      radius={3}
      styles={{
        // inline so they win over Mantine's stylesheet (imported after App.css)
        // title bar: Data section grey + the left bar's section line
        header: {
          backgroundColor: "#e9ecef",
          borderBottom: "2px solid #5c5c5c"
        },
        // scales like .tutorial in App.css, clearly the largest text
        title: {
          fontWeight: 600,
          fontSize: "clamp(22px, min(2vw, 3.5vh), 40px)",
          letterSpacing: "-0.01em",
          color: "var(--mantine-color-blue-filled)"
        },
        // no padding so the separator lines reach the popup edges
        body: { padding: 0 }
      }}
    >
      <div className="tutorial">
        {/* SIDEBAR */}
        <div className="tutorial-sidebar">
          <h3 className="tutorial-heading">Overview</h3>
          <p className="tutorial-overview">
            <b>
              <mark className="tutorial-highlight">
                Stack order is draw order
              </mark>
              :
            </b>{" "}
            the top card is drawn above the cards under it.
          </p>

          <div className="tutorial-divider" />

          <h3 className="tutorial-heading">Controls</h3>
          {CONTROLS.map((control) => (
            <div className="tutorial-control" key={control.name}>
              <span className="tutorial-control-icon">{control.icon}</span>
              <div>
                <div className="tutorial-control-name">{control.name}</div>
                <div className="tutorial-control-text">{control.text}</div>
              </div>
            </div>
          ))}
        </div>

        {/* MASKING WORKFLOW */}
        <div className="tutorial-workflow">
          <h3 className="tutorial-heading">Masking Workflow</h3>
          <p className="tutorial-goal">
            Let's say we want to explore areas where the water is not too
            shallow and not too deep (25-60 m), and hide everything else.
          </p>

          <div className="tutorial-steps">
            {STEPS.map(({ title, highlight }, index) => (
              <div className="tutorial-step" key={title}>
                {/* number + line running to the next step */}
                <div className="tutorial-step-rail">
                  <span className="tutorial-step-number">{index + 1}</span>
                </div>
                <div className="tutorial-step-title">
                  {highlight && (
                    <mark className="tutorial-highlight">{highlight}</mark>
                  )}
                  {title.slice(highlight.length)}
                </div>
                <img
                  className="tutorial-stack-image"
                  src={`/images/LayerStack${index + 1}.webp`}
                  alt={`Layer card for step ${index + 1}: ${title}`}
                />
                <img
                  className="tutorial-map-image"
                  src={`/images/Map${index + 1}.webp`}
                  alt={`Map for step ${index + 1}: ${title}`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
