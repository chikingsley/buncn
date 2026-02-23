import {
  Captions,
  ChapterTitle,
  Controls,
  Gesture,
  MediaPlayer,
  type MediaPlayerInstance,
  MediaProvider,
  Poster,
  Track,
  useMediaState,
} from "@vidstack/react";
import { Music } from "lucide-react";
import { useRef } from "react";
import type { MediaItem } from "../lib/media-data";
import { PlayerControls } from "./player-controls";

interface VideoPlayerProps extends MediaItem {
  variant?: "video" | "audio";
  audioLayout?: "compact" | "deck";
}

function EqualizerBars() {
  const isPaused = useMediaState("paused");
  return (
    <div
      className="flex h-4 items-end gap-[3px] transition-opacity duration-300"
      style={{ opacity: isPaused ? 0.3 : 1 }}
    >
      {[
        { delay: "0ms", height: "60%" },
        { delay: "200ms", height: "100%" },
        { delay: "100ms", height: "45%" },
      ].map(({ delay, height }) => (
        <div
          className="w-[3px] origin-bottom rounded-full bg-primary"
          key={delay}
          style={{
            height,
            animation: isPaused
              ? "none"
              : "equalizer-bar 0.7s ease-in-out infinite alternate",
            animationDelay: delay,
          }}
        />
      ))}
    </div>
  );
}

function BufferingSpinner() {
  const waiting = useMediaState("waiting");
  if (!waiting) {
    return null;
  }
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center">
      <div className="size-12 animate-spin rounded-full border-4 border-white/20 border-t-white" />
    </div>
  );
}

export function VideoPlayer({
  title,
  src,
  poster,
  artist,
  artwork,
  thumbnails,
  captions,
  variant = "video",
  audioLayout = "compact",
}: VideoPlayerProps) {
  const player = useRef<MediaPlayerInstance>(null);
  const isVideo = variant === "video";
  const isAudioDeck = !isVideo && audioLayout === "deck";

  if (!isVideo) {
    if (isAudioDeck) {
      return (
        <MediaPlayer
          className="group/player mx-auto w-full max-w-md overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-lg"
          ref={player}
          src={src}
          title={title}
          viewType="audio"
        >
          {/* Artwork */}
          <div className="relative">
            {artwork ? (
              <img
                alt={`${title} artwork`}
                className="h-64 w-full object-cover"
                height={256}
                src={artwork}
                width={384}
              />
            ) : (
              <div className="flex h-64 w-full items-center justify-center bg-muted">
                <Music className="size-16 text-muted-foreground" />
              </div>
            )}
            {/* Gradient overlay */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card to-transparent" />
          </div>

          {/* Track info */}
          <div className="px-5 pt-1 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <EqualizerBars />
                  <span className="truncate font-semibold text-base">
                    {title}
                  </span>
                </div>
                {artist ? (
                  <span className="truncate text-muted-foreground text-sm">
                    {artist}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <MediaProvider />
          <PlayerControls
            audioLayout="deck"
            thumbnails={thumbnails}
            variant="audio"
          />
        </MediaPlayer>
      );
    }

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
        <PlayerControls audioLayout="compact" variant="audio" />
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
        {captions ? (
          <Track
            default
            kind="subtitles"
            label="English"
            language="en-US"
            src={captions}
          />
        ) : null}
      </MediaProvider>

      {/* Buffering spinner */}
      <BufferingSpinner />

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
        {/* Chapter title at top */}
        <div className="flex items-start px-3 pt-2">
          <ChapterTitle className="rounded bg-black/40 px-2 py-1 font-medium text-sm text-white backdrop-blur-sm" />
        </div>

        <div className="flex-1" />

        {/* Captions overlay */}
        <Captions className="pointer-events-none absolute inset-x-0 bottom-[70px] z-30 flex justify-center px-4" />

        <PlayerControls thumbnails={thumbnails} variant="video" />
      </Controls.Root>
    </MediaPlayer>
  );
}
