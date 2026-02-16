import {
  Controls,
  Gesture,
  MediaPlayer,
  type MediaPlayerInstance,
  MediaProvider,
  Poster,
} from "@vidstack/react";
import { Music } from "lucide-react";
import * as React from "react";
import type { MediaItem } from "../lib/media-data";
import { PlayerControls } from "./player-controls";

interface VideoPlayerProps extends MediaItem {
  variant?: "video" | "audio";
}

export function VideoPlayer({
  title,
  src,
  poster,
  artist,
  artwork,
  variant = "video",
}: VideoPlayerProps) {
  const player = React.useRef<MediaPlayerInstance>(null);
  const isVideo = variant === "video";

  if (!isVideo) {
    return (
      <MediaPlayer
        className="group/player w-full overflow-hidden rounded-lg border bg-card p-4 text-card-foreground"
        ref={player}
        src={src}
        title={title}
        viewType="audio"
      >
        <div className="flex items-center gap-4">
          {artwork ? (
            <img
              alt={`${title} artwork`}
              className="size-16 rounded-md object-cover"
              height={64}
              src={artwork}
              width={64}
            />
          ) : (
            <div className="flex size-16 shrink-0 items-center justify-center rounded-md bg-muted">
              <Music className="size-6 text-muted-foreground" />
            </div>
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate font-medium text-sm">{title}</span>
            {artist ? (
              <span className="truncate text-muted-foreground text-xs">
                {artist}
              </span>
            ) : null}
          </div>
        </div>
        <MediaProvider />
        <PlayerControls variant="audio" />
      </MediaPlayer>
    );
  }

  return (
    <MediaPlayer
      className="group/player relative aspect-video w-full overflow-hidden rounded-lg border bg-black font-sans text-white"
      crossOrigin
      playsInline
      ref={player}
      src={src}
      title={title}
    >
      <MediaProvider>
        {poster ? (
          <Poster
            alt={title}
            className="absolute inset-0 block h-full w-full object-cover opacity-0 transition-opacity data-[visible]:opacity-100"
            src={poster}
          />
        ) : null}
      </MediaProvider>

      <Gesture
        action="toggle:paused"
        className="absolute inset-0 z-0 block h-full w-full"
        event="pointerup"
      />
      <Gesture
        action="toggle:fullscreen"
        className="absolute inset-0 z-0 block h-full w-full"
        event="dblpointerup"
      />
      <Gesture
        action="seek:-10"
        className="absolute top-0 left-0 z-10 block h-full w-1/5"
        event="dblpointerup"
      />
      <Gesture
        action="seek:10"
        className="absolute top-0 right-0 z-10 block h-full w-1/5"
        event="dblpointerup"
      />

      <Controls.Root className="absolute inset-0 z-10 flex h-full w-full flex-col bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-200 data-[visible]:opacity-100">
        <div className="flex-1" />
        <PlayerControls variant="video" />
      </Controls.Root>
    </MediaPlayer>
  );
}
