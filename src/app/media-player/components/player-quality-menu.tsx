import { useVideoQualityOptions } from "@vidstack/react";
import { Tv } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface PlayerQualityMenuProps {
  variant: "video" | "audio";
}

export function PlayerQualityMenu({ variant }: PlayerQualityMenuProps) {
  const options = useVideoQualityOptions({ auto: "Auto", sort: "descending" });
  const selectedOption = options.find((option) => option.selected);

  if (options.disabled || options.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
          variant === "video"
            ? "text-white hover:bg-white/20"
            : "text-foreground hover:bg-accent"
        )}
      >
        <Tv className="size-4" />
        <span className="font-medium text-xs">
          {selectedOption?.label ?? "Quality"}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" side="top" sideOffset={8}>
        <DropdownMenuRadioGroup value={options.selectedValue}>
          {options.map((option) => (
            <DropdownMenuRadioItem
              key={option.value}
              onSelect={(event) => {
                event.preventDefault();
                option.select();
              }}
              value={option.value}
            >
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
