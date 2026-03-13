"use client";

import { useLiveQuery } from "@tanstack/react-db";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  generateRandomSkater,
  getSkaterStatusIcon,
  getStanceIcon,
  getStyleIcon,
} from "@/app/lib/utils";
import { DataGrid } from "@/components/data-grid/data-grid";
import { DataGridFilterMenu } from "@/components/data-grid/data-grid-filter-menu";
import { DataGridKeyboardShortcuts } from "@/components/data-grid/data-grid-keyboard-shortcuts";
import { DataGridRowHeightMenu } from "@/components/data-grid/data-grid-row-height-menu";
import { getDataGridSelectColumn } from "@/components/data-grid/data-grid-select-column";
import { DataGridSortMenu } from "@/components/data-grid/data-grid-sort-menu";
import { DataGridViewMenu } from "@/components/data-grid/data-grid-view-menu";
import { Button } from "@/components/ui/button";
import { skaters } from "@/db/schema";
import { type UseDataGridProps, useDataGrid } from "@/hooks/use-data-grid";
import {
  type UndoRedoCellUpdate,
  useDataGridUndoRedo,
} from "@/hooks/use-data-grid-undo-redo";
import { useWindowSize } from "@/hooks/use-window-size";
import { getFilterFn } from "@/lib/data-grid-filters";
import { generateId } from "@/lib/id";
import { skatersCollection } from "../lib/collections";
import type { SkaterSchema } from "../lib/validation";
import { DataGridActionBar } from "./data-grid-action-bar";

const stanceOptions = skaters.stance.enumValues.map((stance) => ({
  label: stance.charAt(0).toUpperCase() + stance.slice(1),
  value: stance,
  icon: getStanceIcon(stance),
}));

const styleOptions = skaters.style.enumValues.map((style) => ({
  label: style.charAt(0).toUpperCase() + style.slice(1).replace("-", " "),
  value: style,
  icon: getStyleIcon(style),
}));

const statusOptions = skaters.status.enumValues.map((status) => ({
  label: status.charAt(0).toUpperCase() + status.slice(1),
  value: status,
  icon: getSkaterStatusIcon(status),
}));

const trickOptions = [
  "Kickflip",
  "Heelflip",
  "Tre Flip",
  "Hardflip",
  "Varial Flip",
  "360 Flip",
  "Ollie",
  "Nollie",
  "Pop Shove-it",
  "FS Boardslide",
  "BS Boardslide",
  "50-50 Grind",
  "5-0 Grind",
  "Crooked Grind",
  "Smith Grind",
] as const;

const trickSelectOptions = trickOptions.map((trick) => ({
  label: trick,
  value: trick,
}));

function getComparableValue(value: unknown) {
  return value instanceof Date ? value.toISOString() : value;
}

function hasSkaterValueChanged(previousValue: unknown, nextValue: unknown) {
  return (
    JSON.stringify(getComparableValue(previousValue)) !==
    JSON.stringify(getComparableValue(nextValue))
  );
}

function applySkaterSnapshot(skater: SkaterSchema) {
  skatersCollection.update(skater.id, (draft) => {
    Object.assign(draft, skater);
  });
}

function buildSkaterCellUpdates(
  existingSkater: SkaterSchema,
  nextSkater: SkaterSchema
) {
  const updates: UndoRedoCellUpdate[] = [];

  for (const key of Object.keys(nextSkater) as Array<keyof SkaterSchema>) {
    if (!hasSkaterValueChanged(existingSkater[key], nextSkater[key])) {
      continue;
    }

    updates.push({
      rowId: existingSkater.id,
      columnId: key,
      previousValue: existingSkater[key],
      newValue: nextSkater[key],
    });
  }

  return updates;
}

export function DataGridLiveDemo() {
  const [preloadState, setPreloadState] = useState<
    "loading" | "ready" | "error"
  >("loading");

  const preloadCollection = useCallback(async () => {
    setPreloadState("loading");
    try {
      await skatersCollection.preload();
      setPreloadState("ready");
    } catch {
      setPreloadState("error");
      toast.error("Failed to load skaters");
    }
  }, []);

  useEffect(() => {
    preloadCollection();
  }, [preloadCollection]);

  const windowSize = useWindowSize();
  const [sorting, setSorting] = useState<SortingState>([]);

  const { data = [] } = useLiveQuery(
    (q) => {
      let query = q.from({ skater: skatersCollection });

      // Apply user-specified sorting first (primary)
      for (const sort of sorting) {
        const field = sort.id as keyof SkaterSchema;
        const direction = sort.desc ? "desc" : "asc";
        query = query.orderBy((t) => t.skater[field], direction);
      }

      // Always sort by order as implicit default / tiebreaker
      query = query.orderBy((t) => t.skater.order, "asc");

      return query;
    },
    [sorting]
  );
  const skatersById = useMemo(
    () => new Map(data.map((skater) => [skater.id, skater])),
    [data]
  );

  const filterFn = useMemo(() => getFilterFn<SkaterSchema>(), []);

  const columns = useMemo<ColumnDef<SkaterSchema>[]>(
    () => [
      getDataGridSelectColumn<SkaterSchema>({ enableRowMarkers: true }),
      {
        id: "name",
        accessorKey: "name",
        header: "Name",
        minSize: 200,
        filterFn,
        meta: {
          label: "Name",
          cell: {
            variant: "short-text",
          },
        },
      },
      {
        id: "email",
        accessorKey: "email",
        header: "Email",
        minSize: 250,
        filterFn,
        meta: {
          label: "Email",
          cell: {
            variant: "short-text",
          },
        },
      },
      {
        id: "stance",
        accessorKey: "stance",
        header: "Stance",
        minSize: 140,
        filterFn,
        meta: {
          label: "Stance",
          cell: {
            variant: "select",
            options: stanceOptions,
          },
        },
      },
      {
        id: "style",
        accessorKey: "style",
        header: "Style",
        minSize: 160,
        filterFn,
        meta: {
          label: "Style",
          cell: {
            variant: "select",
            options: styleOptions,
          },
        },
      },
      {
        id: "status",
        accessorKey: "status",
        header: "Status",
        minSize: 160,
        filterFn,
        meta: {
          label: "Status",
          cell: {
            variant: "select",
            options: statusOptions,
          },
        },
      },
      {
        id: "tricks",
        accessorKey: "tricks",
        header: "Tricks",
        minSize: 240,
        filterFn,
        meta: {
          label: "Tricks",
          cell: {
            variant: "multi-select",
            options: trickSelectOptions,
          },
        },
      },
      {
        id: "yearsSkating",
        accessorKey: "yearsSkating",
        header: "Years Skating",
        minSize: 160,
        filterFn,
        meta: {
          label: "Years Skating",
          cell: {
            variant: "number",
            min: 0,
            max: 50,
            step: 1,
          },
        },
      },
      {
        id: "startedSkating",
        accessorKey: "startedSkating",
        header: "Skating Since",
        minSize: 170,
        filterFn,
        meta: {
          label: "Skating Since",
          cell: {
            variant: "date",
          },
        },
      },
      {
        id: "isPro",
        accessorKey: "isPro",
        header: "Pro",
        minSize: 90,
        filterFn,
        meta: {
          label: "Pro",
          cell: {
            variant: "checkbox",
          },
        },
      },
      {
        id: "media",
        accessorKey: "media",
        header: "Media",
        minSize: 240,
        filterFn,
        meta: {
          label: "Media",
          cell: {
            variant: "file",
            maxFileSize: 10 * 1024 * 1024,
            maxFiles: 5,
            accept: "image/*,pdf/*,audio/*,video/*",
            multiple: true,
          },
        },
      },
    ],
    [filterFn]
  );

  // Undo/redo support - wraps data changes to track history
  // and allows reverting changes via keyboard shortcuts
  const undoRedoOnDataChange = useCallback(
    (newData: SkaterSchema[]) => {
      const currentIds = new Set(skatersById.keys());
      const newIds = new Set(newData.map((s) => s.id));

      // Delete rows that exist in current but not in new (undo add / redo delete)
      for (const skater of skatersById.values()) {
        if (!newIds.has(skater.id)) {
          skatersCollection.delete(skater.id);
        }
      }

      // Insert or update rows
      for (const skater of newData) {
        if (currentIds.has(skater.id)) {
          // Update existing row
          const existingSkater = skatersById.get(skater.id);
          if (!existingSkater) {
            continue;
          }

          if (buildSkaterCellUpdates(existingSkater, skater).length > 0) {
            applySkaterSnapshot(skater);
          }
        } else {
          // Insert new row (undo delete / redo add)
          skatersCollection.insert(skater);
        }
      }
    },
    [skatersById]
  );

  const { trackCellsUpdate, trackRowsAdd, trackRowsDelete } =
    useDataGridUndoRedo({
      data,
      onDataChange: undoRedoOnDataChange,
      getRowId: (row) => row.id,
    });

  const onDataChange: NonNullable<
    UseDataGridProps<SkaterSchema>["onDataChange"]
  > = useCallback(
    (newData) => {
      const cellUpdates: UndoRedoCellUpdate[] = [];

      for (const skater of newData) {
        const existingSkater = skatersById.get(skater.id);
        if (!existingSkater) {
          // Newly added rows already exist in the collection, so we only need
          // to sync the latest snapshot into the optimistic draft.
          applySkaterSnapshot(skater);
          continue;
        }

        const rowUpdates = buildSkaterCellUpdates(existingSkater, skater);
        if (rowUpdates.length === 0) {
          continue;
        }

        applySkaterSnapshot(skater);
        cellUpdates.push(...rowUpdates);
      }

      if (cellUpdates.length > 0) {
        trackCellsUpdate(cellUpdates);
      }
    },
    [skatersById, trackCellsUpdate]
  );

  const onRowAdd: NonNullable<UseDataGridProps<SkaterSchema>["onRowAdd"]> =
    useCallback(() => {
      const maxOrder = data.reduce((max, s) => Math.max(max, s.order), 0);
      const newSkater = generateRandomSkater();
      const skaterWithOrder = { ...newSkater, order: maxOrder + 1 };

      skatersCollection.insert(skaterWithOrder);

      // Track for undo/redo
      trackRowsAdd([skaterWithOrder]);

      return {
        rowIndex: data.length,
        columnId: "name",
      };
    }, [data, trackRowsAdd]);

  const onRowsAdd: NonNullable<UseDataGridProps<SkaterSchema>["onRowsAdd"]> =
    useCallback(
      (count: number) => {
        const maxOrder = data.reduce((max, s) => Math.max(max, s.order), 0);
        const newRows: SkaterSchema[] = [];

        for (let i = 0; i < count; i++) {
          const newSkater: SkaterSchema = {
            id: generateId(),
            name: null,
            email: null,
            stance: "regular",
            style: "street",
            status: "amateur",
            yearsSkating: 0,
            startedSkating: null,
            isPro: false,
            tricks: null,
            media: null,
            order: maxOrder + i + 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          newRows.push(newSkater);
          skatersCollection.insert(newSkater);
        }

        // Track for undo/redo
        trackRowsAdd(newRows);
      },
      [data, trackRowsAdd]
    );

  const onRowsDelete: NonNullable<
    UseDataGridProps<SkaterSchema>["onRowsDelete"]
  > = useCallback(
    (rowsToDelete) => {
      // Track for undo/redo (before deletion to capture the rows)
      trackRowsDelete(rowsToDelete);

      // Use batch delete - single transaction for all deletions
      skatersCollection.delete(rowsToDelete.map((skater) => skater.id));
    },
    [trackRowsDelete]
  );

  const onFilesUpload: NonNullable<
    UseDataGridProps<SkaterSchema>["onFilesUpload"]
  > = useCallback(async ({ files }) => {
    await new Promise((resolve) => setTimeout(resolve, 800));

    return files.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
    }));
  }, []);

  const onFilesDelete: NonNullable<
    UseDataGridProps<SkaterSchema>["onFilesDelete"]
  > = useCallback(async () => {
    /* TODO: implement file deletion */
  }, []);

  const { table, tableMeta, ...dataGridProps } = useDataGrid({
    data,
    onDataChange,
    onRowAdd,
    onRowsAdd,
    onRowsDelete,
    onFilesUpload,
    onFilesDelete,
    columns,
    getRowId: (row) => row.id,
    initialState: {
      columnPinning: {
        left: ["select"],
      },
      sorting,
    },
    onSortingChange: setSorting,
    manualSorting: true,
    enableSearch: true,
    enablePaste: true,
  });

  const onStatusUpdate = useCallback(
    (value: string) => {
      const selectedRows = table.getSelectedRowModel().rows;
      if (selectedRows.length === 0) {
        toast.error("No skaters selected");
        return;
      }

      // Use batch update - single transaction for all updates
      skatersCollection.update(
        selectedRows.map((row) => row.original.id),
        (drafts) => {
          for (const draft of drafts) {
            draft.status = value as never;
          }
        }
      );

      toast.success(
        `${selectedRows.length} skater${selectedRows.length === 1 ? "" : "s"} updated`
      );
    },
    [table]
  );

  const onStyleUpdate = useCallback(
    (value: string) => {
      const selectedRows = table.getSelectedRowModel().rows;
      if (selectedRows.length === 0) {
        toast.error("No skaters selected");
        return;
      }

      // Use batch update - single transaction for all updates
      skatersCollection.update(
        selectedRows.map((row) => row.original.id),
        (drafts) => {
          for (const draft of drafts) {
            draft.style = value as never;
          }
        }
      );

      toast.success(
        `${selectedRows.length} skater${selectedRows.length === 1 ? "" : "s"} updated`
      );
    },
    [table]
  );

  const onDelete = useCallback(() => {
    const selectedRows = table.getSelectedRowModel().rows;
    if (selectedRows.length === 0) {
      toast.error("No skaters selected");
      return;
    }

    const rowIndices = selectedRows.map((row) => row.index);

    tableMeta.onRowsDelete?.(rowIndices);

    toast.success(
      `${selectedRows.length} skater${selectedRows.length === 1 ? "" : "s"} deleted`
    );
    table.toggleAllRowsSelected(false);
  }, [table, tableMeta]);

  const height = Math.max(400, windowSize.height - 150);
  const selectedCellCount = tableMeta.selectionState?.selectedCells.size ?? 0;

  if (preloadState === "loading") {
    return (
      <div className="container py-4">
        <div className="rounded-md border border-dashed p-6 text-muted-foreground text-sm">
          Loading skaters...
        </div>
      </div>
    );
  }

  if (preloadState === "error") {
    return (
      <div className="container py-4">
        <div className="flex flex-col items-start gap-4 rounded-md border border-dashed p-6">
          <div>
            <div className="font-medium text-sm">
              Could not load the live grid
            </div>
            <div className="text-muted-foreground text-sm">
              The initial skater preload failed. Retry once the API is
              available.
            </div>
          </div>
          <Button onClick={preloadCollection} type="button" variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container flex flex-col gap-4 py-4">
      <div
        aria-orientation="horizontal"
        className="flex items-center gap-2 self-end"
        role="toolbar"
      >
        <DataGridKeyboardShortcuts
          enablePaste
          enableRowAdd
          enableRowsDelete
          enableSearch
          enableUndoRedo
        />
        <DataGridFilterMenu align="end" table={table} />
        <DataGridSortMenu align="end" table={table} />
        <DataGridRowHeightMenu align="end" table={table} />
        <DataGridViewMenu align="end" table={table} />
      </div>
      <DataGrid
        {...dataGridProps}
        height={height}
        table={table}
        tableMeta={tableMeta}
      />
      <DataGridActionBar
        onDelete={onDelete}
        onStatusUpdate={onStatusUpdate}
        onStyleUpdate={onStyleUpdate}
        selectedCellCount={selectedCellCount}
        statusOptions={statusOptions}
        styleOptions={styleOptions}
        table={table}
        tableMeta={tableMeta}
      />
    </div>
  );
}
