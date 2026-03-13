import { AudioGainSlider, TimeSlider, VolumeSlider } from "@vidstack/react";
import { cn } from "@/lib/utils";

interface TimeSliderProps {
  thumbnails?: string;
  variant: "video" | "audio";
}

interface VolumeSliderProps {
  variant: "video" | "audio";
}

export function PlayerTimeSlider({ variant, thumbnails }: TimeSliderProps) {
  const isVideo = variant === "video";

  return (
    <TimeSlider.Root className="group relative inline-flex h-9 w-full cursor-pointer touch-none select-none items-center outline-none">
      <TimeSlider.Track
        className={cn(
          "relative z-0 h-1 w-full rounded-full",
          isVideo ? "bg-white/20" : "bg-muted"
        )}
      >
        <TimeSlider.TrackFill className="absolute h-full w-[var(--slider-fill)] rounded-full bg-primary will-change-[width]" />
        <TimeSlider.Progress
          className={cn(
            "absolute z-10 h-full w-[var(--slider-progress)] rounded-full will-change-[width]",
            isVideo ? "bg-white/40" : "bg-muted-foreground/30"
          )}
        />
      </TimeSlider.Track>
      <TimeSlider.Thumb className="absolute top-1/2 left-[var(--slider-fill)] z-20 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-white opacity-0 shadow-sm transition-opacity will-change-[left] group-data-[interactive]:opacity-100" />
      <TimeSlider.Preview className="pointer-events-none flex flex-col items-center gap-1 opacity-0 transition-opacity data-[visible]:opacity-100">
        {thumbnails ? (
          <TimeSlider.Thumbnail.Root
            className="block h-[var(--thumbnail-height)] max-h-32 min-h-20 w-[var(--thumbnail-width)] min-w-36 overflow-hidden rounded border border-white/20 shadow-md"
            src={thumbnails}
          >
            <TimeSlider.Thumbnail.Img />
          </TimeSlider.Thumbnail.Root>
        ) : null}
        <TimeSlider.Value className="rounded-sm bg-foreground px-2 py-0.5 font-medium text-background text-xs" />
      </TimeSlider.Preview>
    </TimeSlider.Root>
  );
}

export function PlayerVolumeSlider({ variant }: VolumeSliderProps) {
  const isVideo = variant === "video";

  return (
    <VolumeSlider.Root className="group relative mx-1 inline-flex h-9 w-full max-w-20 cursor-pointer touch-none select-none items-center outline-none">
      <VolumeSlider.Track
        className={cn(
          "relative z-0 h-1 w-full rounded-full",
          isVideo ? "bg-white/20" : "bg-muted"
        )}
      >
        <VolumeSlider.TrackFill className="absolute h-full w-[var(--slider-fill)] rounded-full bg-primary will-change-[width]" />
      </VolumeSlider.Track>
      <VolumeSlider.Thumb className="absolute top-1/2 left-[var(--slider-fill)] z-20 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-white opacity-0 shadow-sm transition-opacity will-change-[left] group-data-[interactive]:opacity-100" />
    </VolumeSlider.Root>
  );
}

export function PlayerAudioGainSlider() {
  return (
    <AudioGainSlider.Root className="group relative mx-1 inline-flex h-9 w-full max-w-24 cursor-pointer touch-none select-none items-center outline-none">
      <AudioGainSlider.Track className="relative z-0 h-1 w-full rounded-full bg-muted">
        <AudioGainSlider.TrackFill className="absolute h-full w-[var(--slider-fill)] rounded-full bg-primary will-change-[width]" />
      </AudioGainSlider.Track>
      <AudioGainSlider.Thumb className="absolute top-1/2 left-[var(--slider-fill)] z-20 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-white opacity-0 shadow-sm transition-opacity will-change-[left] group-data-[interactive]:opacity-100" />
      <AudioGainSlider.Preview className="pointer-events-none opacity-0 transition-opacity data-[visible]:opacity-100">
        <AudioGainSlider.Value className="rounded-sm bg-foreground px-2 py-0.5 font-medium text-background text-xs" />
      </AudioGainSlider.Preview>
    </AudioGainSlider.Root>
  );
}
