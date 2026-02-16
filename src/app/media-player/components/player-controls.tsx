import { Controls } from "@vidstack/react";
import {
  FullscreenButton,
  MuteButton,
  PIPButton,
  PlayButton,
} from "./player-buttons";
import { PlayerTimeSlider, PlayerVolumeSlider } from "./player-sliders";
import { PlayerSpeedMenu } from "./player-speed-menu";
import { PlayerTimeDisplay } from "./player-time-display";

interface PlayerControlsProps {
  variant: "video" | "audio";
}

export function PlayerControls({ variant }: PlayerControlsProps) {
  const isVideo = variant === "video";

  return (
    <div
      className={
        isVideo
          ? "flex w-full flex-col gap-0.5 px-2 pb-2"
          : "mt-3 flex flex-col gap-1"
      }
    >
      <Controls.Group className="flex w-full items-center">
        <PlayerTimeSlider variant={variant} />
      </Controls.Group>
      <Controls.Group className="flex w-full items-center gap-0.5">
        <PlayButton variant={variant} />
        <MuteButton variant={variant} />
        <PlayerVolumeSlider variant={variant} />
        <PlayerTimeDisplay variant={variant} />
        <div className="flex-1" />
        <PlayerSpeedMenu variant={variant} />
        {isVideo ? <PIPButton variant={variant} /> : null}
        {isVideo ? <FullscreenButton variant={variant} /> : null}
      </Controls.Group>
    </div>
  );
}
