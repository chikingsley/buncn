import {
  MediaPlayer,
  MediaProvider,
  TimeSlider,
  useMediaRemote,
  useMediaState,
} from "@vidstack/react";
import {
  Gauge,
  List,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Share2,
  Shuffle,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { useState } from "react";
import { MdForward30, MdReplay30 } from "react-icons/md";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type CardKind = "music" | "audiobook";
type RepeatMode = "off" | "all" | "one";

interface QueueTrack {
  artist: string;
  artwork: string;
  explicit?: boolean;
  src: string;
  title: string;
}

const MUSIC_QUEUE: QueueTrack[] = [
  {
    title: "Serenity",
    artist: "SoundHelix",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    artwork:
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=900&q=80",
    explicit: false,
  },
  {
    title: "Night Drive",
    artist: "SoundHelix",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    artwork:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=80",
    explicit: true,
  },
  {
    title: "Signal Fade",
    artist: "SoundHelix",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    artwork:
      "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80",
    explicit: false,
  },
];

const AUDIOBOOK_QUEUE: QueueTrack[] = [
  {
    title: "Chapter 1: The Arrival",
    artist: "Northbound, Vol. 1",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    artwork:
      "https://images.unsplash.com/photo-1513001900722-370f803f498d?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Chapter 2: The City",
    artist: "Northbound, Vol. 1",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
    artwork:
      "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Chapter 3: The Call",
    artist: "Northbound, Vol. 1",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
    artwork:
      "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80",
  },
];

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 2] as const;
const FALLBACK_TRACK: QueueTrack = {
  title: "Untitled",
  artist: "Unknown",
  src: "",
  artwork:
    "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=900&q=80",
};

function formatClock(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds)
    ? Math.max(0, Math.floor(totalSeconds))
    : 0;
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function AudioTimeline({ compact = false }: { compact?: boolean }) {
  const currentTime = useMediaState("currentTime");
  const duration = useMediaState("duration");
  const remaining = Number.isFinite(duration)
    ? Math.max(0, duration - currentTime)
    : 0;

  return (
    <div className="flex flex-col gap-1.5">
      <TimeSlider.Root
        className={cn(
          "group relative inline-flex w-full cursor-pointer touch-none select-none items-center outline-none",
          compact ? "h-8" : "h-9"
        )}
      >
        <TimeSlider.Track
          className={cn(
            "relative z-0 w-full rounded-full bg-muted",
            compact ? "h-1.5" : "h-2"
          )}
        >
          <TimeSlider.TrackFill className="absolute h-full w-[var(--slider-fill)] rounded-full bg-foreground will-change-[width]" />
          <TimeSlider.Progress className="absolute z-10 h-full w-[var(--slider-progress)] rounded-full bg-foreground/25 will-change-[width]" />
        </TimeSlider.Track>
        <TimeSlider.Thumb
          className={cn(
            "absolute top-1/2 left-[var(--slider-fill)] z-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-primary opacity-100 shadow-sm ring-1 ring-black/10 will-change-[left]",
            compact ? "size-3.5" : "size-4"
          )}
        />
      </TimeSlider.Root>
      <div className="flex items-center justify-between font-medium text-[11px] text-muted-foreground tabular-nums">
        <span>{formatClock(currentTime)}</span>
        <span>-{formatClock(remaining)}</span>
      </div>
    </div>
  );
}

interface PlayPauseButtonProps {
  className?: string;
}

function PlayPauseButton({ className }: PlayPauseButtonProps) {
  const paused = useMediaState("paused");
  const remote = useMediaRemote();

  return (
    <Button
      className={cn("size-11 rounded-full", className)}
      onClick={() => (paused ? remote.play() : remote.pause())}
      size="icon"
      type="button"
      variant="default"
    >
      {paused ? <Play className="size-5" /> : <Pause className="size-5" />}
      <span className="sr-only">{paused ? "Play" : "Pause"}</span>
    </Button>
  );
}

function iconButtonStateClass(active: boolean) {
  return active ? "bg-primary/10 text-primary ring-1 ring-primary/30" : "";
}

function SeekButton({
  seconds,
  icon,
  label,
  className,
}: {
  seconds: number;
  icon: React.ReactNode;
  label: string;
  className?: string;
}) {
  const currentTime = useMediaState("currentTime");
  const duration = useMediaState("duration");
  const remote = useMediaRemote();

  return (
    <Button
      className={cn("relative rounded-full", className)}
      onClick={() => {
        let nextTime = Math.max(0, currentTime + seconds);
        if (seconds > 0 && Number.isFinite(duration)) {
          nextTime = Math.min(duration, currentTime + seconds);
        }
        remote.seek(nextTime);
      }}
      size="icon"
      type="button"
      variant="ghost"
    >
      {icon}
      <span className="sr-only">{label}</span>
    </Button>
  );
}

function SpeedButton() {
  const playbackRate = useMediaState("playbackRate");
  const remote = useMediaRemote();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button className="size-9 rounded-full" size="icon" variant="ghost" />
        }
      >
        <Gauge className="size-4" />
        <span className="sr-only">Playback speed</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top">
        <DropdownMenuRadioGroup
          onValueChange={(value) => remote.changePlaybackRate(Number(value))}
          value={String(playbackRate)}
        >
          {SPEED_OPTIONS.map((speed) => (
            <DropdownMenuRadioItem key={speed} value={String(speed)}>
              {speed === 1 ? "Normal" : `${speed}x`}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function QueueDrawer({
  currentIndex,
  label,
  onSelect,
  tracks,
  triggerClassName,
}: {
  tracks: QueueTrack[];
  currentIndex: number;
  label: string;
  onSelect: (index: number) => void;
  triggerClassName?: string;
}) {
  return (
    <Drawer>
      <DrawerTrigger
        className={cn(
          "inline-flex items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
          triggerClassName
        )}
        type="button"
      >
        <List className="size-4" />
        <span className="sr-only">Open queue</span>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{label}</DrawerTitle>
          <DrawerDescription>Pick a track to play next.</DrawerDescription>
        </DrawerHeader>
        <div className="max-h-80 overflow-y-auto px-4 pb-4">
          <div className="grid gap-1">
            {tracks.map((track, index) => (
              <button
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
                  index === currentIndex && "bg-accent"
                )}
                key={track.src}
                onClick={() => onSelect(index)}
                type="button"
              >
                <span className="truncate">{track.title}</span>
                <span className="text-muted-foreground text-xs">
                  #{index + 1}
                </span>
              </button>
            ))}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function AudioPlayerCard({
  kind,
  queue,
  size = "default",
}: {
  kind: CardKind;
  queue: QueueTrack[];
  size?: "default" | "thin";
}) {
  const [trackIndex, setTrackIndex] = useState(0);
  const [autoPlayOnTrackChange, setAutoPlayOnTrackChange] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [shuffle, setShuffle] = useState(false);

  const currentTrack = queue[trackIndex] ?? queue[0] ?? FALLBACK_TRACK;
  const isThin = size === "thin";
  const sideButton = isThin ? "size-10" : "size-11";
  const utilityButton = isThin ? "size-9" : "size-10";
  const playButton = isThin ? "size-11" : "size-12";
  const artworkHeight = isThin ? "h-28" : "h-44";
  const contentSpacing = isThin
    ? "gap-2.5 px-4 pt-2.5 pb-1.5"
    : "gap-3 px-4.5 py-4";

  const label = kind === "music" ? "Now Playing" : "Audiobook";
  const hasQueue = queue.length > 0;

  const goTo = (index: number, autoPlay = false) => {
    setTrackIndex(index);
    setAutoPlayOnTrackChange(autoPlay);
  };

  const previousTrack = () => {
    if (!hasQueue) {
      return;
    }
    const previousIndex =
      trackIndex - 1 < 0 ? queue.length - 1 : trackIndex - 1;
    goTo(previousIndex, true);
  };

  const nextTrack = () => {
    if (!hasQueue) {
      return;
    }
    if (shuffle) {
      const randomIndex = Math.floor(Math.random() * queue.length);
      goTo(randomIndex, true);
      return;
    }
    const nextIndex = trackIndex + 1 >= queue.length ? 0 : trackIndex + 1;
    goTo(nextIndex, true);
  };

  const handleEnded = () => {
    if (!hasQueue) {
      return;
    }
    if (repeatMode === "one") {
      return;
    }

    if (repeatMode === "all") {
      nextTrack();
      return;
    }

    if (trackIndex < queue.length - 1) {
      goTo(trackIndex + 1, true);
    }
  };

  const handleShare = async () => {
    const payload = {
      title: currentTrack.title,
      text: `${currentTrack.title} - ${currentTrack.artist}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(payload);
        return;
      } catch {
        // Fall back to clipboard when share fails.
      }
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${payload.text}\n${payload.url}`);
      }
    } catch {
      // Ignore clipboard permission errors in demo environment.
    }
  };

  const repeatIcon = repeatMode === "one" ? Repeat1 : Repeat;
  const RepeatIcon = repeatIcon;

  return (
    <MediaPlayer
      autoPlay={autoPlayOnTrackChange}
      className={cn(
        "group/player flex w-full flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm",
        isThin ? "max-w-[15.5rem]" : "max-w-[19rem]"
      )}
      loop={repeatMode === "one"}
      onCanPlay={() => {
        if (autoPlayOnTrackChange) {
          setAutoPlayOnTrackChange(false);
        }
      }}
      onEnded={handleEnded}
      src={currentTrack.src}
      title={currentTrack.title}
      viewType="audio"
    >
      <div className={cn("relative w-full overflow-hidden", artworkHeight)}>
        <img
          alt={`${currentTrack.title} cover art`}
          className="h-full w-full object-cover"
          height={640}
          src={currentTrack.artwork}
          width={640}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute right-3 bottom-3 rounded-full bg-background/90 px-2 py-0.5 font-medium text-[11px] text-foreground backdrop-blur">
          {label}
        </div>
      </div>

      <div className={cn("flex flex-col", contentSpacing)}>
        <div className="flex items-center gap-3">
          <img
            alt=""
            aria-hidden="true"
            className={cn(
              "shrink-0 rounded-md object-cover",
              isThin ? "size-9" : "size-12"
            )}
            height={48}
            src={currentTrack.artwork}
            width={48}
          />
          <div className="min-w-0 space-y-0.5">
            <h3
              className={cn(
                "truncate font-bold",
                isThin ? "text-base" : "text-lg"
              )}
            >
              {currentTrack.title}
            </h3>
            {kind === "music" && currentTrack.explicit ? (
              <Badge
                className="h-4 rounded-sm px-1 text-[10px]"
                variant="secondary"
              >
                E
              </Badge>
            ) : null}
            <p
              className={cn(
                "truncate text-muted-foreground",
                isThin ? "text-xs" : "text-sm"
              )}
            >
              {currentTrack.artist}
            </p>
          </div>
        </div>

        <AudioTimeline compact={isThin} />

        {kind === "music" ? (
          <div className="grid grid-cols-5 items-center gap-1">
            <Button
              className={cn(
                `${utilityButton} justify-self-center rounded-full`,
                iconButtonStateClass(shuffle)
              )}
              onClick={() => setShuffle((value) => !value)}
              size="icon"
              type="button"
              variant="ghost"
            >
              <Shuffle className="size-4" />
              <span className="sr-only">Shuffle</span>
            </Button>

            <Button
              className={`${sideButton} justify-self-center rounded-full`}
              onClick={previousTrack}
              size="icon"
              type="button"
              variant="ghost"
            >
              <SkipBack className="size-5" />
              <span className="sr-only">Previous track</span>
            </Button>

            <PlayPauseButton className={`${playButton} justify-self-center`} />

            <Button
              className={`${sideButton} justify-self-center rounded-full`}
              onClick={nextTrack}
              size="icon"
              type="button"
              variant="ghost"
            >
              <SkipForward className="size-5" />
              <span className="sr-only">Next track</span>
            </Button>

            <Button
              className={cn(
                `${utilityButton} justify-self-center rounded-full`,
                iconButtonStateClass(repeatMode !== "off")
              )}
              onClick={() => {
                setRepeatMode((mode) => {
                  if (mode === "off") {
                    return "all";
                  }
                  if (mode === "all") {
                    return "one";
                  }
                  return "off";
                });
              }}
              size="icon"
              type="button"
              variant="ghost"
            >
              <RepeatIcon className="size-4" />
              <span className="sr-only">Repeat</span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-5 items-center gap-1">
            <Button
              className={`${utilityButton} justify-self-center rounded-full`}
              onClick={previousTrack}
              size="icon"
              type="button"
              variant="ghost"
            >
              <SkipBack className="size-4" />
              <span className="sr-only">Previous chapter</span>
            </Button>

            <SeekButton
              className={`${sideButton} justify-self-center`}
              icon={<MdReplay30 className="size-6" />}
              label="Back 30 seconds"
              seconds={-30}
            />

            <PlayPauseButton className={`${playButton} justify-self-center`} />

            <SeekButton
              className={`${sideButton} justify-self-center`}
              icon={<MdForward30 className="size-6" />}
              label="Forward 30 seconds"
              seconds={30}
            />

            <Button
              className={`${utilityButton} justify-self-center rounded-full`}
              onClick={nextTrack}
              size="icon"
              type="button"
              variant="ghost"
            >
              <SkipForward className="size-4" />
              <span className="sr-only">Next chapter</span>
            </Button>
          </div>
        )}

        <div
          className={cn(
            "flex items-center border-t",
            isThin ? "pt-1" : "pt-2",
            kind === "audiobook" ? "justify-between" : "justify-end"
          )}
        >
          {kind === "audiobook" ? <SpeedButton /> : null}

          <div className="flex items-center gap-1">
            <QueueDrawer
              currentIndex={trackIndex}
              label={kind === "music" ? "Music Queue" : "Chapter Queue"}
              onSelect={(index) => goTo(index, true)}
              tracks={hasQueue ? queue : [FALLBACK_TRACK]}
              triggerClassName={utilityButton}
            />
            <Button
              className={`${utilityButton} rounded-full`}
              onClick={handleShare}
              size="icon"
              type="button"
              variant="ghost"
            >
              <Share2 className="size-4" />
              <span className="sr-only">Share</span>
            </Button>
          </div>
        </div>
      </div>

      <MediaProvider />
    </MediaPlayer>
  );
}

export function AudioShowcase() {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="grid grid-cols-1 items-start justify-items-center gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AudioPlayerCard kind="music" queue={MUSIC_QUEUE} />
        <AudioPlayerCard kind="music" queue={MUSIC_QUEUE} size="thin" />
        <AudioPlayerCard kind="audiobook" queue={AUDIOBOOK_QUEUE} />
        <AudioPlayerCard kind="audiobook" queue={AUDIOBOOK_QUEUE} size="thin" />
      </div>
    </div>
  );
}
