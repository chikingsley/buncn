import { LayoutGrid } from "lucide-react";
import { Link } from "react-router-dom";
import { ActiveLink } from "@/components/active-link";
import { Icons } from "@/components/icons";
import { ModeToggle } from "@/components/layouts/mode-toggle";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-border/40 border-b bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60">
      <div className="container flex h-14 items-center">
        <Button
          className="size-8"
          render={<Link to="/" />}
          size="icon"
          variant="ghost"
        >
          <LayoutGrid />
        </Button>
        <nav className="flex w-full items-center text-sm">
          <ActiveLink href="/data-grid">Data Grid</ActiveLink>
          <ActiveLink href="/data-grid-live">Data Grid Live</ActiveLink>
          <ActiveLink href="/mail">Mail</ActiveLink>
          <ActiveLink href="/media-player">Media Player</ActiveLink>
        </nav>
        <nav className="flex flex-1 items-center md:justify-end">
          <Button
            className="size-8"
            render={
              // biome-ignore lint/a11y/useAnchorContent: aria-label is on the anchor
              <a
                aria-label="GitHub repo"
                href={siteConfig.links.github}
                rel="noopener noreferrer"
                target="_blank"
              />
            }
            size="icon"
            variant="ghost"
          >
            <Icons.gitHub aria-hidden="true" className="size-4" />
          </Button>
          <ModeToggle />
        </nav>
      </div>
    </header>
  );
}
