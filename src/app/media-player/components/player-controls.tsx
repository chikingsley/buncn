import { Controls } from "@vidstack/react";
import {
  FullscreenButton,
  MuteButton,
  PIPButton,
  PlayButton,
  PlayerCaptionButton,
  SeekBackwardButton,
  SeekForwardButton,
} from "./player-buttons";
import { PlayerQualityMenu } from "./player-quality-menu";
import {
  PlayerAudioGainSlider,
  PlayerTimeSlider,
  PlayerVolumeSlider,
} from "./player-sliders";
import { PlayerSpeedMenu } from "./player-speed-menu";
import { PlayerTimeDisplay } from "./player-time-display";

interface PlayerControlsProps {
  audioLayout?: "compact" | "deck";
  thumbnails?: string;
  variant: "video" | "audio";
}

export function PlayerControls({
  variant,
  audioLayout = "compact",
  thumbnails,
}: PlayerControlsProps) {
  const isVideo = variant === "video";
  const isAudioDeck = !isVideo && audioLayout === "deck";

  let wrapperClass = "mt-3 flex flex-col gap-1";
  if (isVideo) {
    wrapperClass = "flex w-full flex-col gap-0.5 px-2 pb-2";
  } else if (isAudioDeck) {
    wrapperClass = "mt-4 flex flex-col gap-3";
  }

  return (
    <div className={wrapperClass}>
      <Controls.Group className="flex w-full items-center">
        <PlayerTimeSlider thumbnails={thumbnails} variant={variant} />
      </Controls.Group>

      <Controls.Group
        className={
          isAudioDeck
            ? "flex w-full items-center justify-center gap-3"
            : "flex w-full items-center gap-0.5"
        }
      >
        {isAudioDeck ? (
          <>
            <SeekBackwardButton variant={variant} />
            <PlayButton variant={variant} />
            <SeekForwardButton variant={variant} />
          </>
        ) : (
          <>
            <PlayButton variant={variant} />
            {isVideo ? null : <SeekBackwardButton variant={variant} />}
            {isVideo ? null : <SeekForwardButton variant={variant} />}
            <MuteButton variant={variant} />
            <PlayerVolumeSlider variant={variant} />
            <PlayerTimeDisplay variant={variant} />
            <div className="flex-1" />
            {isVideo ? <PlayerCaptionButton variant={variant} /> : null}
            {isVideo ? <PlayerQualityMenu variant={variant} /> : null}
            <PlayerSpeedMenu variant={variant} />
            {isVideo ? <PIPButton variant={variant} /> : null}
            {isVideo ? <FullscreenButton variant={variant} /> : null}
          </>
        )}
      </Controls.Group>

      {isAudioDeck ? (
        <Controls.Group className="flex w-full items-center gap-1">
          <MuteButton variant={variant} />
          <PlayerVolumeSlider variant={variant} />
          <PlayerAudioGainSlider />
          <PlayerTimeDisplay variant={variant} />
          <div className="flex-1" />
          <PlayerSpeedMenu variant={variant} />
        </Controls.Group>
      ) : null}
    </div>
  );
}
