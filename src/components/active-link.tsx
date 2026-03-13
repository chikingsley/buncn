"use client";

import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ActiveLinkProps {
  children: React.ReactNode;
  className?: string;
  href: string;
  rel?: string;
  target?: string;
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

  if (isExternal) {
    return (
      <Button
        nativeButton={false}
        render={
          // biome-ignore lint/a11y/useAnchorContent: content provided via Button children
          <a
            className={cn(
              "font-normal text-foreground/60 data-[state=active]:text-accent-foreground",
              className
            )}
            data-state={isActive ? "active" : "inactive"}
            href={href}
            rel={rel}
            target={target}
          />
        }
        size="sm"
        variant="ghost"
      >
        {children}
      </Button>
    );
  }

  return (
    <Button
      nativeButton={false}
      render={
        <Link
          className={cn(
            "font-normal text-foreground/60 data-[state=active]:text-accent-foreground",
            className
          )}
          data-state={isActive ? "active" : "inactive"}
          to={href}
        />
      }
      size="sm"
      variant="ghost"
    >
      {children}
    </Button>
  );
}
