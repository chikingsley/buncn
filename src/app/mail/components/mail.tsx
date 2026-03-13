import {
  AlertCircle,
  Archive,
  File,
  Inbox,
  type LucideIcon,
  Mail as MailIcon,
  MessagesSquare,
  Send,
  ShoppingCart,
  Trash2,
  Users2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Mail as MailType } from "@/db/schema";

import type { Account } from "../lib/data";
import { MailDisplay } from "./mail-display";
import { MailList } from "./mail-list";
import { MailNav } from "./mail-nav";
import { MailTeamSwitcher } from "./mail-team-switcher";
import { MailUserNav } from "./mail-user-nav";

const LAYOUT_STORAGE_KEY = "mail-content-layout";
const LIST_PANEL_ID = "mail-list";
const DISPLAY_PANEL_ID = "mail-display";

function getSavedLayout(): Record<string, number> | null {
  try {
    const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (!saved) {
      return null;
    }

    const parsed = JSON.parse(saved) as unknown;

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      !Array.isArray(parsed)
    ) {
      const layout = parsed as Record<string, unknown>;
      const list = layout[LIST_PANEL_ID];
      const display = layout[DISPLAY_PANEL_ID];
      if (typeof list === "number" && typeof display === "number") {
        return {
          [LIST_PANEL_ID]: list,
          [DISPLAY_PANEL_ID]: display,
        };
      }
    }

    if (
      Array.isArray(parsed) &&
      parsed.length >= 2 &&
      parsed.every((value) => typeof value === "number")
    ) {
      const list = parsed.at(-2);
      const display = parsed.at(-1);
      if (typeof list !== "number" || typeof display !== "number") {
        return null;
      }
      return {
        [LIST_PANEL_ID]: list,
        [DISPLAY_PANEL_ID]: display,
      };
    }

    return null;
  } catch {
    return null;
  }
}

interface MailProps {
  accounts: Account[];
  currentFolder: string;
  folderCounts: Record<string, number>;
  mails: MailType[];
  onAction: (action: string, mailId: string) => void;
  onFolderChange: (folder: string) => void;
}

interface MailSidebarBodyProps {
  accounts: Account[];
  onFolderSelect: (title: string) => void;
  primaryLinks: Array<{
    title: string;
    label?: string;
    icon: LucideIcon;
    variant: "default" | "ghost";
  }>;
  secondaryLinks: Array<{
    title: string;
    label?: string;
    icon: LucideIcon;
    variant: "default" | "ghost";
  }>;
}

function MailSidebarBody({
  accounts,
  primaryLinks,
  secondaryLinks,
  onFolderSelect,
}: MailSidebarBodyProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <>
      <SidebarHeader>
        <MailTeamSwitcher accounts={accounts} />
      </SidebarHeader>
      <SidebarSeparator className="mx-0 w-full bg-border/40" />
      <SidebarContent>
        <SidebarGroup className="p-0">
          <MailNav
            isCollapsed={isCollapsed}
            links={primaryLinks}
            onSelect={onFolderSelect}
          />
        </SidebarGroup>
        <SidebarSeparator className="mx-0 w-full bg-border/40" />
        <SidebarGroup className="p-0">
          <MailNav isCollapsed={isCollapsed} links={secondaryLinks} />
        </SidebarGroup>
      </SidebarContent>
      <SidebarSeparator className="mx-0 w-full bg-border/40" />
      <SidebarFooter>
        {accounts[0] ? <MailUserNav user={accounts[0]} /> : null}
      </SidebarFooter>
    </>
  );
}

export function Mail({
  accounts,
  mails,
  folderCounts,
  currentFolder,
  onFolderChange,
  onAction,
}: MailProps) {
  const savedLayout = useMemo(() => getSavedLayout(), []);
  const [selectedMailId, setSelectedMailId] = useState<string | null>(
    mails[0]?.id ?? null
  );

  const selectedMail = useMemo(
    () => mails.find((m) => m.id === selectedMailId) ?? null,
    [mails, selectedMailId]
  );

  useEffect(() => {
    if (mails.length === 0) {
      setSelectedMailId(null);
      return;
    }

    if (!(selectedMailId && mails.some((mail) => mail.id === selectedMailId))) {
      setSelectedMailId(mails[0]?.id ?? null);
    }
  }, [mails, selectedMailId]);

  const handleFolderSelect = useCallback(
    (title: string) => {
      const folder = title.toLowerCase();
      onFolderChange(folder);
      setSelectedMailId(null);
    },
    [onFolderChange]
  );

  const primaryLinks = useMemo(
    () => [
      {
        title: "Inbox",
        label: String(folderCounts.inbox ?? 0),
        icon: Inbox,
        variant: (currentFolder === "inbox" ? "default" : "ghost") as
          | "default"
          | "ghost",
      },
      {
        title: "Drafts",
        label: String(folderCounts.drafts ?? 0),
        icon: File,
        variant: (currentFolder === "drafts" ? "default" : "ghost") as
          | "default"
          | "ghost",
      },
      {
        title: "Sent",
        label: String(folderCounts.sent ?? 0),
        icon: Send,
        variant: (currentFolder === "sent" ? "default" : "ghost") as
          | "default"
          | "ghost",
      },
      {
        title: "Junk",
        label: String(folderCounts.junk ?? 0),
        icon: AlertCircle,
        variant: (currentFolder === "junk" ? "default" : "ghost") as
          | "default"
          | "ghost",
      },
      {
        title: "Trash",
        label: String(folderCounts.trash ?? 0),
        icon: Trash2,
        variant: (currentFolder === "trash" ? "default" : "ghost") as
          | "default"
          | "ghost",
      },
      {
        title: "Archive",
        label: String(folderCounts.archive ?? 0),
        icon: Archive,
        variant: (currentFolder === "archive" ? "default" : "ghost") as
          | "default"
          | "ghost",
      },
    ],
    [folderCounts, currentFolder]
  );

  const secondaryLinks = useMemo(
    () => [
      {
        title: "Social",
        label: "",
        icon: Users2,
        variant: "ghost" as const,
      },
      {
        title: "Updates",
        label: "",
        icon: AlertCircle,
        variant: "ghost" as const,
      },
      {
        title: "Forums",
        label: "",
        icon: MessagesSquare,
        variant: "ghost" as const,
      },
      {
        title: "Shopping",
        label: "",
        icon: ShoppingCart,
        variant: "ghost" as const,
      },
      {
        title: "Promotions",
        label: "",
        icon: MailIcon,
        variant: "ghost" as const,
      },
    ],
    []
  );

  return (
    <TooltipProvider delay={0}>
      <SidebarProvider className="h-full min-h-0">
        <Sidebar
          className="top-14 bottom-auto h-[calc(100dvh-3.5rem)] border-r"
          collapsible="icon"
        >
          <MailSidebarBody
            accounts={accounts}
            onFolderSelect={handleFolderSelect}
            primaryLinks={primaryLinks}
            secondaryLinks={secondaryLinks}
          />
        </Sidebar>

        <SidebarInset className="min-h-0">
          <div className="flex h-14 items-center border-border/40 border-b px-4">
            <SidebarTrigger className="-ml-1 size-10" />
            <div className="ml-3 font-semibold text-lg">Mail</div>
          </div>
          <ResizablePanelGroup
            className="h-[calc(100%-56px)] min-h-0 min-w-0 items-stretch"
            defaultLayout={savedLayout ?? undefined}
            onLayoutChanged={(layout) => {
              localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
            }}
            orientation="horizontal"
          >
            <ResizablePanel
              className="min-w-0 overflow-hidden"
              defaultSize={40}
              id={LIST_PANEL_ID}
              maxSize={55}
              minSize={28}
            >
              <MailList
                items={mails}
                onSelect={setSelectedMailId}
                selectedMailId={selectedMailId}
              />
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel
              className="min-w-0 overflow-hidden"
              defaultSize={60}
              id={DISPLAY_PANEL_ID}
              maxSize={72}
              minSize={45}
            >
              <MailDisplay mail={selectedMail} onAction={onAction} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
