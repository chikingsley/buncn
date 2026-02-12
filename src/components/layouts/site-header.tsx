import { LayoutGrid } from "lucide-react";
import Link from "next/link";
import { ActiveLink } from "@/components/active-link";
import { Icons } from "@/components/icons";
import { DocsLink } from "@/components/layouts/docs-link";
import { ModeToggle } from "@/components/layouts/mode-toggle";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-border/40 border-b bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60">
      <div className="container flex h-14 items-center">
        <Button asChild className="size-8" size="icon" variant="ghost">
          <Link href="/">
            <LayoutGrid />
          </Link>
        </Button>
        <nav className="flex w-full items-center text-sm">
          <ActiveLink href="/data-grid">Data Grid</ActiveLink>
          <ActiveLink href="/data-grid-live">Data Grid Live</ActiveLink>
          <DocsLink />
        </nav>
        <nav className="flex flex-1 items-center md:justify-end">
          <Button asChild className="size-8" size="icon" variant="ghost">
            <Link
              aria-label="GitHub repo"
              href={siteConfig.links.github}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Icons.gitHub aria-hidden="true" className="size-4" />
            </Link>
          </Button>
          <ModeToggle />
        </nav>
      </div>
    </header>
  );
}
