"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import { ActiveLink } from "@/components/active-link";

export function DocsLink() {
  const segment = useSelectedLayoutSegment();
  const href = segment?.startsWith("data-grid")
    ? "https://diceui.com/docs/components/data-grid"
    : "https://diceui.com/docs/components/data-table";

  return (
    <ActiveLink href={href} rel="noopener noreferrer" target="_blank">
      Docs
    </ActiveLink>
  );
}
