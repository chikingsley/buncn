import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface AccountSwitcherProps {
  accounts: Array<{
    label: string;
    email: string;
    icon: LucideIcon;
  }>;
  isCollapsed: boolean;
}

export function AccountSwitcher({
  isCollapsed,
  accounts,
}: AccountSwitcherProps) {
  const [selectedAccount, setSelectedAccount] = useState<string>(
    accounts[0]?.email ?? ""
  );

  const selected = accounts.find(
    (account) => account.email === selectedAccount
  );

  return (
    <Select
      defaultValue={selectedAccount}
      onValueChange={(value) => {
        if (value !== null) {
          setSelectedAccount(value);
        }
      }}
    >
      <SelectTrigger
        aria-label="Select account"
        className={cn(
          "flex w-full items-center gap-2 pr-8 [&>span]:line-clamp-1 [&>span]:flex [&>span]:w-full [&>span]:items-center [&>span]:gap-1 [&>span]:truncate [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0",
          isCollapsed &&
            "flex h-9 w-9 shrink-0 items-center justify-center p-0 [&>span]:w-auto [&>svg]:hidden"
        )}
      >
        <SelectValue placeholder="Select an account">
          {selected ? (
            <>
              <selected.icon className="h-4 w-4" />
              <span className={cn("ml-2", isCollapsed && "hidden")}>
                {selected.label}
              </span>
            </>
          ) : (
            "Select an account"
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {accounts.map((account) => (
          <SelectItem key={account.email} value={account.email}>
            <div className="flex items-center gap-3 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 [&_svg]:text-foreground">
              <account.icon className="h-4 w-4" />
              {account.email}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
