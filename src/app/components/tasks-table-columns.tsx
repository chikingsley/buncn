"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  CalendarIcon,
  CircleDashed,
  Clock,
  Ellipsis,
  Text,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Task, tasks } from "@/db/schema";
import { formatDate } from "@/lib/format";
import { getErrorMessage } from "@/lib/handle-error";
import type { DataTableRowAction } from "@/types/data-table";

import { updateTask } from "../lib/actions";
import { getPriorityIcon, getStatusIcon } from "../lib/utils";

interface GetTasksTableColumnsProps {
  statusCounts: Record<Task["status"], number>;
  priorityCounts: Record<Task["priority"], number>;
  estimatedHoursRange: { min: number; max: number };
  setRowAction: React.Dispatch<
    React.SetStateAction<DataTableRowAction<Task> | null>
  >;
}

export function getTasksTableColumns({
  statusCounts,
  priorityCounts,
  estimatedHoursRange,
  setRowAction,
}: GetTasksTableColumnsProps): ColumnDef<Task>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all"
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          className="translate-y-0.5"
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label="Select row"
          checked={row.getIsSelected()}
          className="translate-y-0.5"
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
      enableHiding: false,
      enableSorting: false,
      size: 40,
    },
    {
      id: "code",
      accessorKey: "code",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Task" />
      ),
      cell: ({ row }) => <div className="w-20">{row.getValue("code")}</div>,
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "title",
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Title" />
      ),
      cell: ({ row }) => {
        const label = tasks.label.enumValues.find(
          (label) => label === row.original.label
        );

        return (
          <div className="flex items-center gap-2">
            {label && <Badge variant="outline">{label}</Badge>}
            <span className="max-w-125 truncate font-medium">
              {row.getValue("title")}
            </span>
          </div>
        );
      },
      meta: {
        label: "Title",
        placeholder: "Search titles...",
        variant: "text",
        icon: Text,
      },
      enableColumnFilter: true,
    },
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Status" />
      ),
      cell: ({ cell }) => {
        const status = tasks.status.enumValues.find(
          (status) => status === cell.getValue<Task["status"]>()
        );

        if (!status) {
          return null;
        }

        const Icon = getStatusIcon(status);

        return (
          <Badge className="py-1 [&>svg]:size-3.5" variant="outline">
            <Icon />
            <span className="capitalize">{status}</span>
          </Badge>
        );
      },
      meta: {
        label: "Status",
        variant: "multiSelect",
        options: tasks.status.enumValues.map((status) => ({
          label: status.charAt(0).toUpperCase() + status.slice(1),
          value: status,
          count: statusCounts[status],
          icon: getStatusIcon(status),
        })),
        icon: CircleDashed,
      },
      enableColumnFilter: true,
    },
    {
      id: "priority",
      accessorKey: "priority",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Priority" />
      ),
      cell: ({ cell }) => {
        const priority = tasks.priority.enumValues.find(
          (priority) => priority === cell.getValue<Task["priority"]>()
        );

        if (!priority) {
          return null;
        }

        const Icon = getPriorityIcon(priority);

        return (
          <Badge className="py-1 [&>svg]:size-3.5" variant="outline">
            <Icon />
            <span className="capitalize">{priority}</span>
          </Badge>
        );
      },
      meta: {
        label: "Priority",
        variant: "multiSelect",
        options: tasks.priority.enumValues.map((priority) => ({
          label: priority.charAt(0).toUpperCase() + priority.slice(1),
          value: priority,
          count: priorityCounts[priority],
          icon: getPriorityIcon(priority),
        })),
        icon: ArrowUpDown,
      },
      enableColumnFilter: true,
    },
    {
      id: "estimatedHours",
      accessorKey: "estimatedHours",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Est. Hours" />
      ),
      cell: ({ cell }) => {
        const estimatedHours = cell.getValue<number>();
        return <div className="w-20 text-right">{estimatedHours}</div>;
      },
      meta: {
        label: "Est. Hours",
        variant: "range",
        range: [estimatedHoursRange.min, estimatedHoursRange.max],
        unit: "hr",
        icon: Clock,
      },
      enableColumnFilter: true,
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Created At" />
      ),
      cell: ({ cell }) => formatDate(cell.getValue<Date>()),
      meta: {
        label: "Created At",
        variant: "dateRange",
        icon: CalendarIcon,
      },
      enableColumnFilter: true,
    },
    {
      id: "actions",
      cell({ row }) {
        const [isUpdatePending, startUpdateTransition] = React.useTransition();

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label="Open menu"
                className="flex size-8 p-0 data-[state=open]:bg-muted"
                variant="ghost"
              >
                <Ellipsis aria-hidden="true" className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onSelect={() => setRowAction({ row, variant: "update" })}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Labels</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup
                    onValueChange={(value) => {
                      startUpdateTransition(() => {
                        toast.promise(
                          updateTask({
                            id: row.original.id,
                            label: value as Task["label"],
                          }),
                          {
                            loading: "Updating...",
                            success: "Label updated",
                            error: (err) => getErrorMessage(err),
                          }
                        );
                      });
                    }}
                    value={row.original.label}
                  >
                    {tasks.label.enumValues.map((label) => (
                      <DropdownMenuRadioItem
                        className="capitalize"
                        disabled={isUpdatePending}
                        key={label}
                        value={label}
                      >
                        {label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setRowAction({ row, variant: "delete" })}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      size: 40,
    },
  ];
}
