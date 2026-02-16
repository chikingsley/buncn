import { useMediaRemote, useMediaState } from "@vidstack/react";
import { Gauge } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

interface PlayerSpeedMenuProps {
  variant: "video" | "audio";
}

export function PlayerSpeedMenu({ variant }: PlayerSpeedMenuProps) {
  const playbackRate = useMediaState("playbackRate");
  const remote = useMediaRemote();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex size-8 cursor-pointer items-center justify-center rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
          variant === "video"
            ? "text-white hover:bg-white/20"
            : "text-foreground hover:bg-accent"
        )}
      >
        <Gauge className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" side="top" sideOffset={8}>
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
