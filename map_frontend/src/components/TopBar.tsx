
import { Button, Group, Menubar, Switch } from "@mantine/core";
import { ScreenMode, useAppContext } from "../hooks/useAppContext";

export default function TopBar() {
  const { screenMode, setScreenMode, uiHidden, setUiHidden } = useAppContext();

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
      {/* Left side */}
      <Switch
        label="Hide UI"
        labelPosition="left"
        color="dark"
        checked={uiHidden}
        onChange={(event) => setUiHidden(event.currentTarget.checked)}
        styles={{ label: { fontWeight: 600 } }}
      />

      {/* Right side */}
      <Group gap={4}>
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
            screenMode === ScreenMode.Three_Screen
              ? "filled"
              : "subtle"
          }
          color="dark"
          onClick={() => setScreenMode(ScreenMode.Three_Screen)}
        >
          4 Screens
        </Button>
      </Group>
    </Menubar>
  );
}