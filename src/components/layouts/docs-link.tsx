"use client";

import { useLocation } from "react-router-dom";
import { ActiveLink } from "@/components/active-link";

export function DocsLink() {
  const location = useLocation();
  const href = location.pathname.startsWith("/data-grid")
    ? "https://diceui.com/docs/components/data-grid"
    : "https://diceui.com/docs/components/data-table";

  return (
    <ActiveLink href={href} rel="noopener noreferrer" target="_blank">
      Docs
    </ActiveLink>
  );
}
