"use client";

import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ActiveLinkProps {
  href: string;
  className?: string;
  children: React.ReactNode;
  target?: string;
  rel?: string;
}

export function ActiveLink({
  href,
  className,
  children,
  target,
  rel,
}: ActiveLinkProps) {
  const location = useLocation();
  const isExternal = href.startsWith("http://") || href.startsWith("https://");

  const hrefSegment = href.split("/").filter(Boolean)[0] ?? "";
  const currentSegment = location.pathname.split("/").filter(Boolean)[0] ?? "";
  const isActive = isExternal ? false : hrefSegment === currentSegment;

  return (
    <Button asChild size="sm" variant="ghost">
      {isExternal ? (
        <a
          className={cn(
            "font-normal text-foreground/60 data-[state=active]:text-accent-foreground",
            className
          )}
          data-state={isActive ? "active" : "inactive"}
          href={href}
          rel={rel}
          target={target}
        >
          {children}
        </a>
      ) : (
        <Link
          className={cn(
            "font-normal text-foreground/60 data-[state=active]:text-accent-foreground",
            className
          )}
          data-state={isActive ? "active" : "inactive"}
          to={href}
        >
          {children}
        </Link>
      )}
    </Button>
  );
}
