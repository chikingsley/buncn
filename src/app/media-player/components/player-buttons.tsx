import {
  useCaptionOptions,
  useMediaRemote,
  useMediaState,
} from "@vidstack/react";
import {
  Captions,
  Maximize,
  Minimize,
  Pause,
  PictureInPicture2,
  Play,
  RotateCcw,
  RotateCw,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ButtonProps {
  variant: "video" | "audio";
}

function buttonClass(variant: "video" | "audio") {
  return cn(
    "inline-flex size-8 cursor-pointer items-center justify-center rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
    variant === "video"
      ? "text-white hover:bg-white/20"
      : "text-foreground hover:bg-accent"
  );
}

export function PlayButton({ variant }: ButtonProps) {
  const isPaused = useMediaState("paused");
  const remote = useMediaRemote();

  return (
    <Tooltip>
      <TooltipTrigger
        className={buttonClass(variant)}
        onClick={() => (isPaused ? remote.play() : remote.pause())}
      >
        {isPaused ? <Play className="size-4" /> : <Pause className="size-4" />}
      </TooltipTrigger>
      <TooltipContent side="top">
        {isPaused ? "Play (k)" : "Pause (k)"}
      </TooltipContent>
    </Tooltip>
  );
}

function VolumeIcon({ volume, isMuted }: { volume: number; isMuted: boolean }) {
  if (isMuted || volume === 0) {
    return <VolumeX className="size-4" />;
  }
  if (volume < 0.5) {
    return <Volume1 className="size-4" />;
  }
  return <Volume2 className="size-4" />;
}

export function MuteButton({ variant }: ButtonProps) {
  const volume = useMediaState("volume");
  const isMuted = useMediaState("muted");
  const remote = useMediaRemote();

  return (
    <Tooltip>
      <TooltipTrigger
        className={buttonClass(variant)}
        onClick={() => (isMuted ? remote.unmute() : remote.mute())}
      >
        <VolumeIcon isMuted={isMuted} volume={volume} />
      </TooltipTrigger>
      <TooltipContent side="top">
        {isMuted ? "Unmute (m)" : "Mute (m)"}
      </TooltipContent>
    </Tooltip>
  );
}

export function FullscreenButton({ variant }: ButtonProps) {
  const isFullscreen = useMediaState("fullscreen");
  const remote = useMediaRemote();

  return (
    <Tooltip>
      <TooltipTrigger
        className={buttonClass(variant)}
        onClick={() =>
          isFullscreen ? remote.exitFullscreen() : remote.enterFullscreen()
        }
      >
        {isFullscreen ? (
          <Minimize className="size-4" />
        ) : (
          <Maximize className="size-4" />
        )}
      </TooltipTrigger>
      <TooltipContent side="top">
        {isFullscreen ? "Exit fullscreen (f)" : "Fullscreen (f)"}
      </TooltipContent>
    </Tooltip>
  );
}

export function PIPButton({ variant }: ButtonProps) {
  const isPiP = useMediaState("pictureInPicture");
  const remote = useMediaRemote();

  return (
    <Tooltip>
      <TooltipTrigger
        className={buttonClass(variant)}
        onClick={() =>
          isPiP ? remote.exitPictureInPicture() : remote.enterPictureInPicture()
        }
      >
        <PictureInPicture2 className="size-4" />
      </TooltipTrigger>
      <TooltipContent side="top">
        {isPiP ? "Exit PiP" : "Picture-in-Picture"}
      </TooltipContent>
    </Tooltip>
  );
}

export function SeekBackwardButton({ variant }: ButtonProps) {
  const currentTime = useMediaState("currentTime");
  const remote = useMediaRemote();

  return (
    <Tooltip>
      <TooltipTrigger
        className={buttonClass(variant)}
        onClick={() => remote.seek(Math.max(0, currentTime - 10))}
      >
        <RotateCcw className="size-4" />
      </TooltipTrigger>
      <TooltipContent side="top">Back 10s</TooltipContent>
    </Tooltip>
  );
}

export function SeekForwardButton({ variant }: ButtonProps) {
  const currentTime = useMediaState("currentTime");
  const duration = useMediaState("duration");
  const remote = useMediaRemote();
  const nextTime = Number.isFinite(duration)
    ? Math.min(duration, currentTime + 10)
    : currentTime + 10;

  return (
    <Tooltip>
      <TooltipTrigger
        className={buttonClass(variant)}
        onClick={() => remote.seek(nextTime)}
      >
        <RotateCw className="size-4" />
      </TooltipTrigger>
      <TooltipContent side="top">Forward 10s</TooltipContent>
    </Tooltip>
  );
}

export function PlayerCaptionButton({ variant }: ButtonProps) {
  const options = useCaptionOptions();
  const remote = useMediaRemote();
  const textTrack = useMediaState("textTrack");
  const captionsOn = textTrack !== null;

  if (options.disabled) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger
        className={cn(
          buttonClass(variant),
          captionsOn &&
            (variant === "video"
              ? "bg-white/20 text-white"
              : "bg-accent text-accent-foreground")
        )}
        onClick={() => remote.toggleCaptions()}
      >
        <Captions className="size-4" />
      </TooltipTrigger>
      <TooltipContent side="top">
        {captionsOn ? "Hide captions (c)" : "Captions (c)"}
      </TooltipContent>
    </Tooltip>
  );
}
