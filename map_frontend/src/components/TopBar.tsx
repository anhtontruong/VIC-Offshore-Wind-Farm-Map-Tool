
import { useState } from "react";
import {
  ActionIcon,
  Button,
  Group,
  Menubar,
  Switch,
  Tooltip
} from "@mantine/core";
import { IconHelp } from "@tabler/icons-react";
import { ScreenMode, useAppContext } from "../hooks/useAppContext";
import LayerStackTutorial from "./LayerStackTutorial";

// ================ //
//     COMPONENT
// ================ //
/**
 * Top menu bar of the app ("Hide UI" switch, tutorial,
 * 1, 2 and 4 screens).
 */
export default function TopBar() {
  // # Context
  const { screenMode, setScreenMode, uiHidden, setUiHidden } = useAppContext();

  // # State
  // starts open: the tutorial shows on every page load
  const [tutorialOpened, setTutorialOpened] = useState(true);

  // # JSX
  return (
    <Menubar
      w="100%"
      h={56}
      px="lg"
      style={{
        justifyContent: "space-between",
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #e9ecef",
        borderRadius: 0,
      }}
    >
      {/* LEFT SIDE */}
      <Switch
        label="Hide UI"
        labelPosition="left"
        color="dark"
        checked={uiHidden}
        onChange={(event) => setUiHidden(event.currentTarget.checked)}
        styles={{ label: { fontWeight: 600 } }}
      />

      {/* RIGHT SIDE */}
      <Group gap={4}>
        {/* TUTORIAL */}
        <Tooltip label="Layer Stack tutorial">
          <ActionIcon
            size={36} // same height as the size="sm" buttons
            radius="sm"
            variant="subtle"
            color="dark"
            aria-label="Layer Stack tutorial"
            onClick={() => setTutorialOpened(true)}
          >
            <IconHelp size={20} />
          </ActionIcon>
        </Tooltip>
        {/* rendered in a portal, so it takes no space in the bar */}
        <LayerStackTutorial
          opened={tutorialOpened}
          onClose={() => setTutorialOpened(false)}
        />

        {/* SCREEN MODE */}
        <Button
          size="sm"
          radius="sm"
          variant={
            screenMode === ScreenMode.One_Screen
              ? "filled"
              : "subtle"
          }
          color="dark"
          onClick={() => setScreenMode(ScreenMode.One_Screen)}
        >
          1 Screen
        </Button>

        <Button
          size="sm"
          radius="sm"
          variant={
            screenMode === ScreenMode.Two_Screen
              ? "filled"
              : "subtle"
          }
          color="dark"
          onClick={() => setScreenMode(ScreenMode.Two_Screen)}
        >
          2 Screens
        </Button>

        <Button
          size="sm"
          radius="sm"
          variant={
            screenMode === ScreenMode.Four_Screen
              ? "filled"
              : "subtle"
          }
          color="dark"
          onClick={() => setScreenMode(ScreenMode.Four_Screen)}
        >
          4 Screens
        </Button>
      </Group>
    </Menubar>
  );
}
