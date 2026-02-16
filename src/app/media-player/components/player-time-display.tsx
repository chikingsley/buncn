import { Time } from "@vidstack/react";
import { cn } from "@/lib/utils";

interface PlayerTimeDisplayProps {
  variant: "video" | "audio";
}

export function PlayerTimeDisplay({ variant }: PlayerTimeDisplayProps) {
  const isVideo = variant === "video";

  return (
    <div className="ml-1.5 flex items-center gap-0.5 font-medium text-xs tabular-nums">
      <Time
        className={cn(isVideo ? "text-white" : "text-foreground")}
        type="current"
      />
      <span className={cn(isVideo ? "text-white/60" : "text-muted-foreground")}>
        /
      </span>
      <Time
        className={cn(isVideo ? "text-white/60" : "text-muted-foreground")}
        type="duration"
      />
    </div>
  );
}
