"use client";

import { cn } from "@/lib/utils";

function Label({ className, ...props }: React.ComponentProps<"label">) {
  // biome-ignore lint/a11y/noLabelWithoutControl: Reusable label wrapper; consumers pass
  // the associated control via htmlFor or by wrapping an input.
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: Reusable label wrapper; consumers pass the associated control.
    <label
      className={cn(
        "flex select-none items-center gap-2 font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50 group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50",
        className
      )}
      data-slot="label"
      {...props}
    />
  );
}

export { Label };
