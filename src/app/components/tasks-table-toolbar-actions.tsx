"use client";

import type { Table } from "@tanstack/react-table";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Task } from "@/db/schema";
import { exportTableToCSV } from "@/lib/export";

import { CreateTaskSheet } from "./create-task-sheet";
import { DeleteTasksDialog } from "./delete-tasks-dialog";

interface TasksTableToolbarActionsProps {
  table: Table<Task>;
}

export function TasksTableToolbarActions({
  table,
}: TasksTableToolbarActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {table.getFilteredSelectedRowModel().rows.length > 0 ? (
        <DeleteTasksDialog
          onSuccess={() => table.toggleAllRowsSelected(false)}
          tasks={table
            .getFilteredSelectedRowModel()
            .rows.map((row) => row.original)}
        />
      ) : null}
      <CreateTaskSheet />
      <Button
        onClick={() =>
          exportTableToCSV(table, {
            filename: "tasks",
            excludeColumns: ["select", "actions"],
          })
        }
        size="sm"
        variant="outline"
      >
        <Download />
        Export
      </Button>
      {/**
       * Other actions can be added here.
       * For example, import, view, etc.
       */}
    </div>
  );
}
