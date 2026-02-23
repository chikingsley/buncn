"use client";

import type { ColumnSort, Table } from "@tanstack/react-table";
import {
  ArrowDownUp,
  ChevronsUpDown,
  GripVertical,
  Trash2,
} from "lucide-react";
import {
  type ComponentProps,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  SortableOverlay,
} from "@/components/sortable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { dataTableConfig } from "@/config/data-table";
import { cn } from "@/lib/utils";

const SORT_SHORTCUT_KEY = "s";
const REMOVE_SORT_SHORTCUTS = ["backspace", "delete"];

interface DataTableSortListProps<TData>
  extends ComponentProps<typeof PopoverContent> {
  table: Table<TData>;
  disabled?: boolean;
}

export function DataTableSortList<TData>({
  table,
  disabled,
  ...props
}: DataTableSortListProps<TData>) {
  const id = useId();
  const labelId = useId();
  const descriptionId = useId();
  const [open, setOpen] = useState(false);
  const addButtonRef = useRef<HTMLButtonElement>(null);

  const sorting = table.getState().sorting;
  const onSortingChange = table.setSorting;

  const { columnLabels, columns } = useMemo(() => {
    const labels = new Map<string, string>();
    const sortingIds = new Set(sorting.map((s) => s.id));
    const availableColumns: { id: string; label: string }[] = [];

    for (const column of table.getAllColumns()) {
      if (!column.getCanSort()) {
        continue;
      }

      const label = column.columnDef.meta?.label ?? column.id;
      labels.set(column.id, label);

      if (!sortingIds.has(column.id)) {
        availableColumns.push({ id: column.id, label });
      }
    }

    return {
      columnLabels: labels,
      columns: availableColumns,
    };
  }, [sorting, table]);

  const onSortAdd = useCallback(() => {
    const firstColumn = columns[0];
    if (!firstColumn) {
      return;
    }

    onSortingChange((prevSorting) => [
      ...prevSorting,
      { id: firstColumn.id, desc: false },
    ]);
  }, [columns, onSortingChange]);

  const onSortUpdate = useCallback(
    (sortId: string, updates: Partial<ColumnSort>) => {
      onSortingChange((prevSorting) => {
        if (!prevSorting) {
          return prevSorting;
        }
        return prevSorting.map((sort) =>
          sort.id === sortId ? { ...sort, ...updates } : sort
        );
      });
    },
    [onSortingChange]
  );

  const onSortRemove = useCallback(
    (sortId: string) => {
      onSortingChange((prevSorting) =>
        prevSorting.filter((item) => item.id !== sortId)
      );
    },
    [onSortingChange]
  );

  const onSortingReset = useCallback(
    () => onSortingChange(table.initialState.sorting),
    [onSortingChange, table.initialState.sorting]
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target instanceof HTMLElement &&
          event.target.contentEditable === "true")
      ) {
        return;
      }

      if (
        event.key.toLowerCase() === SORT_SHORTCUT_KEY &&
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey
      ) {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const onTriggerKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (
        REMOVE_SORT_SHORTCUTS.includes(event.key.toLowerCase()) &&
        sorting.length > 0
      ) {
        event.preventDefault();
        onSortingReset();
      }
    },
    [sorting.length, onSortingReset]
  );

  return (
    <Sortable
      getItemValue={(item) => item.id}
      onValueChange={onSortingChange}
      value={sorting}
    >
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger
          render={
            <Button
              className="font-normal"
              disabled={disabled}
              onKeyDown={onTriggerKeyDown}
              size="sm"
              variant="outline"
            />
          }
        >
          <ArrowDownUp className="text-muted-foreground" />
          Sort
          {sorting.length > 0 && (
            <Badge
              className="h-[18.24px] rounded-[3.2px] px-[5.12px] font-mono font-normal text-[10.4px]"
              variant="secondary"
            >
              {sorting.length}
            </Badge>
          )}
        </PopoverTrigger>
        <PopoverContent
          aria-describedby={descriptionId}
          aria-labelledby={labelId}
          className="flex w-full max-w-(--radix-popover-content-available-width) flex-col gap-3.5 p-4 sm:min-w-[380px]"
          {...props}
        >
          <div className="flex flex-col gap-1">
            <h4 className="font-medium leading-none" id={labelId}>
              {sorting.length > 0 ? "Sort by" : "No sorting applied"}
            </h4>
            <p
              className={cn(
                "text-muted-foreground text-sm",
                sorting.length > 0 && "sr-only"
              )}
              id={descriptionId}
            >
              {sorting.length > 0
                ? "Modify sorting to organize your rows."
                : "Add sorting to organize your rows."}
            </p>
          </div>
          {sorting.length > 0 && (
            <SortableContent
              render={
                <ul className="flex max-h-[300px] flex-col gap-2 overflow-y-auto p-1" />
              }
            >
              {sorting.map((sort) => (
                <DataTableSortItem
                  columnLabels={columnLabels}
                  columns={columns}
                  key={sort.id}
                  onSortRemove={onSortRemove}
                  onSortUpdate={onSortUpdate}
                  sort={sort}
                  sortItemId={`${id}-sort-${sort.id}`}
                />
              ))}
            </SortableContent>
          )}
          <div className="flex w-full items-center gap-2">
            <Button
              className="rounded"
              disabled={columns.length === 0}
              onClick={onSortAdd}
              ref={addButtonRef}
              size="sm"
            >
              Add sort
            </Button>
            {sorting.length > 0 && (
              <Button
                className="rounded"
                onClick={onSortingReset}
                size="sm"
                variant="outline"
              >
                Reset sorting
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
      <SortableOverlay>
        <div className="flex items-center gap-2">
          <div className="h-8 w-[180px] rounded-sm bg-primary/10" />
          <div className="h-8 w-24 rounded-sm bg-primary/10" />
          <div className="size-8 shrink-0 rounded-sm bg-primary/10" />
          <div className="size-8 shrink-0 rounded-sm bg-primary/10" />
        </div>
      </SortableOverlay>
    </Sortable>
  );
}

interface DataTableSortItemProps {
  sort: ColumnSort;
  sortItemId: string;
  columns: { id: string; label: string }[];
  columnLabels: Map<string, string>;
  onSortUpdate: (sortId: string, updates: Partial<ColumnSort>) => void;
  onSortRemove: (sortId: string) => void;
}

function DataTableSortItem({
  sort,
  sortItemId,
  columns,
  columnLabels,
  onSortUpdate,
  onSortRemove,
}: DataTableSortItemProps) {
  const fieldListboxId = `${sortItemId}-field-listbox`;
  const fieldTriggerId = `${sortItemId}-field-trigger`;
  const directionListboxId = `${sortItemId}-direction-listbox`;

  const [showFieldSelector, setShowFieldSelector] = useState(false);
  const [showDirectionSelector, setShowDirectionSelector] = useState(false);

  const onItemKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (showFieldSelector || showDirectionSelector) {
        return;
      }

      if (REMOVE_SORT_SHORTCUTS.includes(event.key.toLowerCase())) {
        event.preventDefault();
        onSortRemove(sort.id);
      }
    },
    [sort.id, showFieldSelector, showDirectionSelector, onSortRemove]
  );

  return (
    <SortableItem
      render={
        <button
          className="flex items-center gap-2"
          id={sortItemId}
          onClick={(event) => event.currentTarget.focus()}
          onKeyDown={onItemKeyDown}
          tabIndex={-1}
          type="button"
        />
      }
      value={sort.id}
    >
      <Popover onOpenChange={setShowFieldSelector} open={showFieldSelector}>
        <PopoverTrigger
          render={
            <Button
              aria-controls={fieldListboxId}
              className="w-44 justify-between rounded font-normal"
              id={fieldTriggerId}
              size="sm"
              variant="outline"
            />
          }
        >
          <span className="truncate">{columnLabels.get(sort.id)}</span>
          <ChevronsUpDown className="opacity-50" />
        </PopoverTrigger>
        <PopoverContent
          className="w-(--radix-popover-trigger-width) p-0"
          id={fieldListboxId}
        >
          <Command>
            <CommandInput placeholder="Search fields..." />
            <CommandList>
              <CommandEmpty>No fields found.</CommandEmpty>
              <CommandGroup>
                {columns.map((column) => (
                  <CommandItem
                    key={column.id}
                    onSelect={(value) => onSortUpdate(sort.id, { id: value })}
                    value={column.id}
                  >
                    <span className="truncate">{column.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Select
        onOpenChange={setShowDirectionSelector}
        onValueChange={(value) => {
          if (value !== null) {
            onSortUpdate(sort.id, { desc: value === "desc" });
          }
        }}
        open={showDirectionSelector}
        value={sort.desc ? "desc" : "asc"}
      >
        <SelectTrigger
          aria-controls={directionListboxId}
          className="w-24 rounded"
          size="sm"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent
          className="min-w-(--radix-select-trigger-width)"
          id={directionListboxId}
        >
          {dataTableConfig.sortOrders.map((order) => (
            <SelectItem key={order.value} value={order.value}>
              {order.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        aria-controls={sortItemId}
        className="size-8 shrink-0 rounded"
        onClick={() => onSortRemove(sort.id)}
        size="icon"
        variant="outline"
      >
        <Trash2 />
      </Button>
      <SortableItemHandle
        render={
          <Button
            className="size-8 shrink-0 rounded"
            size="icon"
            variant="outline"
          />
        }
      >
        <GripVertical />
      </SortableItemHandle>
    </SortableItem>
  );
}
