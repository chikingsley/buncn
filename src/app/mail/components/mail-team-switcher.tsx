import { ChevronsUpDown, Plus } from "lucide-react";
import type { Account } from "@/app/mail/lib/data";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface MailTeamSwitcherProps {
  accounts: Account[];
}

export function MailTeamSwitcher({ accounts }: MailTeamSwitcherProps) {
  const activeAccount = accounts[0];

  if (!activeAccount) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<SidebarMenuButton className="h-10" size="lg" />}
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <activeAccount.icon className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">
                {activeAccount.label}
              </span>
              <span className="truncate text-xs">{activeAccount.email}</span>
            </div>
            <ChevronsUpDown className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-72 min-w-56 rounded-lg"
            sideOffset={4}
          >
            {accounts.map((account) => (
              <DropdownMenuItem key={account.email}>
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <account.icon className="size-4 shrink-0" />
                </div>
                <span>{account.email}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem>
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <Plus className="size-4" />
              </div>
              <span>Add account</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
