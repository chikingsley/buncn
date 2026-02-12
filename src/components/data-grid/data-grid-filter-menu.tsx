"use client";

import { useDirection } from "@radix-ui/react-direction";
import type { Column, ColumnFilter, Table } from "@tanstack/react-table";
import {
  CalendarIcon,
  Check,
  ChevronsUpDown,
  GripVertical,
  ListFilter,
  Trash2,
} from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
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
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  SortableOverlay,
} from "@/components/ui/sortable";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import {
  getDefaultOperator,
  getOperatorsForVariant,
} from "@/lib/data-grid-filters";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { FilterOperator, FilterValue } from "@/types/data-grid";

const FILTER_SHORTCUT_KEY = "f";
const REMOVE_FILTER_SHORTCUTS = new Set(["backspace", "delete"]);
const FILTER_DEBOUNCE_MS = 300;
const OPERATORS_WITHOUT_VALUE = new Set([
  "isEmpty",
  "isNotEmpty",
  "isTrue",
  "isFalse",
]);

interface DataGridFilterMenuProps<TData>
  extends React.ComponentProps<typeof PopoverContent> {
  table: Table<TData>;
  disabled?: boolean;
}

export function DataGridFilterMenu<TData>({
  table,
  disabled,
  className,
  ...props
}: DataGridFilterMenuProps<TData>) {
  const dir = useDirection();
  const id = React.useId();
  const labelId = React.useId();
  const descriptionId = React.useId();
  const [open, setOpen] = React.useState(false);
  const addButtonRef = React.useRef<HTMLButtonElement>(null);

  const columnFilters = table.getState().columnFilters;

  const { columnLabels, columns, columnVariants } = React.useMemo(() => {
    const labels = new Map<string, string>();
    const variants = new Map<string, string>();
    const filteringIds = new Set(columnFilters.map((f) => f.id));
    const availableColumns: { id: string; label: string }[] = [];

    for (const column of table.getAllColumns()) {
      if (!column.getCanFilter()) {
        continue;
      }

      const label = column.columnDef.meta?.label ?? column.id;
      const variant = column.columnDef.meta?.cell?.variant ?? "short-text";

      labels.set(column.id, label);
      variants.set(column.id, variant);

      if (!filteringIds.has(column.id)) {
        availableColumns.push({ id: column.id, label });
      }
    }

    return {
      columnLabels: labels,
      columns: availableColumns,
      columnVariants: variants,
    };
  }, [columnFilters, table]);

  const onFilterAdd = React.useCallback(() => {
    const firstColumn = columns[0];
    if (!firstColumn) {
      return;
    }

    const variant = columnVariants.get(firstColumn.id) ?? "short-text";
    const defaultOperator = getDefaultOperator(variant);

    table.setColumnFilters((prevFilters) => [
      ...prevFilters,
      {
        id: firstColumn.id,
        value: {
          operator: defaultOperator,
          value: "",
        },
      },
    ]);
  }, [columns, columnVariants, table]);

  const onFilterUpdate = React.useCallback(
    (filterId: string, updates: Partial<ColumnFilter>) => {
      table.setColumnFilters((prevFilters) => {
        if (!prevFilters) {
          return prevFilters;
        }
        return prevFilters.map((filter) =>
          filter.id === filterId ? { ...filter, ...updates } : filter
        );
      });
    },
    [table]
  );

  const onFilterRemove = React.useCallback(
    (filterId: string) => {
      table.setColumnFilters((prevFilters) =>
        prevFilters.filter((item) => item.id !== filterId)
      );
    },
    [table]
  );

  const onFiltersReset = React.useCallback(() => {
    table.setColumnFilters(table.initialState.columnFilters ?? []);
  }, [table]);

  React.useEffect(() => {
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
        event.key.toLowerCase() === FILTER_SHORTCUT_KEY &&
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

  const onTriggerKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (
        REMOVE_FILTER_SHORTCUTS.has(event.key.toLowerCase()) &&
        columnFilters.length > 0
      ) {
        event.preventDefault();
        onFiltersReset();
      }
    },
    [columnFilters.length, onFiltersReset]
  );

  return (
    <Sortable
      getItemValue={(item) => item.id}
      onValueChange={table.setColumnFilters}
      value={columnFilters}
    >
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger asChild>
          <Button
            className="font-normal"
            dir={dir}
            disabled={disabled}
            onKeyDown={onTriggerKeyDown}
            size="sm"
            variant="outline"
          >
            <ListFilter className="text-muted-foreground" />
            Filter
            {columnFilters.length > 0 && (
              <Badge
                className="h-[18.24px] rounded-[3.2px] px-[5.12px] font-mono font-normal text-[10.4px]"
                variant="secondary"
              >
                {columnFilters.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          aria-describedby={descriptionId}
          aria-labelledby={labelId}
          className={cn(
            "flex w-full max-w-(--radix-popover-content-available-width) flex-col gap-3.5 p-4 sm:min-w-[480px]",
            className
          )}
          dir={dir}
          {...props}
        >
          <div className="flex flex-col gap-1">
            <h4 className="font-medium leading-none" id={labelId}>
              {columnFilters.length > 0 ? "Filter by" : "No filters applied"}
            </h4>
            <p
              className={cn(
                "text-muted-foreground text-sm",
                columnFilters.length > 0 && "sr-only"
              )}
              id={descriptionId}
            >
              {columnFilters.length > 0
                ? "Modify filters to narrow down your data."
                : "Add filters to narrow down your data."}
            </p>
          </div>
          {columnFilters.length > 0 && (
            <SortableContent asChild>
              <div
                className="flex max-h-[400px] flex-col gap-2 overflow-y-auto p-1"
                role="list"
              >
                {columnFilters.map((filter, index) => (
                  <DataGridFilterItem
                    columnLabels={columnLabels}
                    columns={columns}
                    columnVariants={columnVariants}
                    dir={dir}
                    filter={filter}
                    filterItemId={`${id}-filter-${filter.id}`}
                    index={index}
                    key={filter.id}
                    onFilterRemove={onFilterRemove}
                    onFilterUpdate={onFilterUpdate}
                    table={table}
                  />
                ))}
              </div>
            </SortableContent>
          )}
          <div className="flex w-full items-center gap-2">
            <Button
              className="rounded"
              disabled={columns.length === 0}
              onClick={onFilterAdd}
              ref={addButtonRef}
              size="sm"
            >
              Add filter
            </Button>
            {columnFilters.length > 0 && (
              <Button
                className="rounded"
                onClick={onFiltersReset}
                size="sm"
                variant="outline"
              >
                Reset filters
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
      <SortableOverlay>
        <div className="flex items-center gap-2" dir={dir}>
          <div className="h-8 min-w-[72px] rounded-sm bg-primary/10" />
          <div className="h-8 w-32 rounded-sm bg-primary/10" />
          <div className="h-8 w-32 rounded-sm bg-primary/10" />
          <div className="h-8 w-36 rounded-sm bg-primary/10" />
          <div className="size-8 shrink-0 rounded-sm bg-primary/10" />
          <div className="size-8 shrink-0 rounded-sm bg-primary/10" />
        </div>
      </SortableOverlay>
    </Sortable>
  );
}

interface DataGridFilterItemProps<TData> {
  filter: ColumnFilter;
  index: number;
  filterItemId: string;
  dir: "ltr" | "rtl";
  columns: { id: string; label: string }[];
  columnLabels: Map<string, string>;
  columnVariants: Map<string, string>;
  table: Table<TData>;
  onFilterUpdate: (filterId: string, updates: Partial<ColumnFilter>) => void;
  onFilterRemove: (filterId: string) => void;
}

function DataGridFilterItem<TData>({
  filter,
  index,
  filterItemId,
  dir,
  columns,
  columnLabels,
  columnVariants,
  table,
  onFilterUpdate,
  onFilterRemove,
}: DataGridFilterItemProps<TData>) {
  const fieldListboxId = `${filterItemId}-field-listbox`;
  const fieldTriggerId = `${filterItemId}-field-trigger`;
  const operatorListboxId = `${filterItemId}-operator-listbox`;
  const inputId = `${filterItemId}-input`;

  const [showFieldSelector, setShowFieldSelector] = React.useState(false);
  const [showOperatorSelector, setShowOperatorSelector] = React.useState(false);

  const variant = columnVariants.get(filter.id) ?? "short-text";
  const filterValue = filter.value as FilterValue | undefined;
  const operator = filterValue?.operator ?? getDefaultOperator(variant);

  const operators = getOperatorsForVariant(variant);
  const needsValue = !OPERATORS_WITHOUT_VALUE.has(operator);

  const column = table.getColumn(filter.id);

  const onItemKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (showFieldSelector || showOperatorSelector) {
        return;
      }

      if (REMOVE_FILTER_SHORTCUTS.has(event.key.toLowerCase())) {
        event.preventDefault();
        onFilterRemove(filter.id);
      }
    },
    [filter.id, showFieldSelector, showOperatorSelector, onFilterRemove]
  );

  const onOperatorChange = React.useCallback(
    (newOperator: FilterOperator) => {
      onFilterUpdate(filter.id, {
        value: {
          operator: newOperator,
          value: filterValue?.value,
          endValue: filterValue?.endValue,
        },
      });
    },
    [filter.id, filterValue?.value, filterValue?.endValue, onFilterUpdate]
  );

  const onValueChange = React.useCallback(
    (newValue: string | number | string[] | undefined) => {
      onFilterUpdate(filter.id, {
        value: {
          operator,
          value: newValue,
          endValue: filterValue?.endValue,
        },
      });
    },
    [filter.id, operator, filterValue?.endValue, onFilterUpdate]
  );

  const onEndValueChange = React.useCallback(
    (newValue: string | number | string[] | undefined) => {
      onFilterUpdate(filter.id, {
        value: {
          operator,
          value: filterValue?.value,
          endValue: newValue as string | number | undefined,
        },
      });
    },
    [filter.id, operator, filterValue?.value, onFilterUpdate]
  );

  return (
    <SortableItem asChild value={filter.id}>
      <div
        className="flex items-center gap-2"
        id={filterItemId}
        onKeyDown={onItemKeyDown}
        role="listitem"
        tabIndex={-1}
      >
        <div className="min-w-[72px] text-center">
          {index === 0 ? (
            <span className="text-muted-foreground text-sm">Where</span>
          ) : (
            <span className="text-muted-foreground text-sm">And</span>
          )}
        </div>
        <Popover onOpenChange={setShowFieldSelector} open={showFieldSelector}>
          <PopoverTrigger asChild>
            <Button
              aria-controls={fieldListboxId}
              className="w-32 justify-between rounded font-normal"
              dir={dir}
              id={fieldTriggerId}
              size="sm"
              variant="outline"
            >
              <span className="truncate">{columnLabels.get(filter.id)}</span>
              <ChevronsUpDown className="opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-40 p-0"
            dir={dir}
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
                      onSelect={(value) => {
                        const newVariant =
                          columnVariants.get(value) ?? "short-text";
                        const newOperator = getDefaultOperator(newVariant);

                        table.setColumnFilters((prevFilters) =>
                          prevFilters.map((f) =>
                            f.id === filter.id
                              ? {
                                  id: value,
                                  value: {
                                    operator: newOperator,
                                    value: "",
                                  },
                                }
                              : f
                          )
                        );
                        setShowFieldSelector(false);
                      }}
                      value={column.id}
                    >
                      <span className="truncate">{column.label}</span>
                      <Check
                        className={cn(
                          "ms-auto",
                          column.id === filter.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <Select
          onOpenChange={setShowOperatorSelector}
          onValueChange={onOperatorChange}
          open={showOperatorSelector}
          value={operator}
        >
          <SelectTrigger
            aria-controls={operatorListboxId}
            className="w-32 rounded lowercase"
            size="sm"
          >
            <div className="truncate">
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent id={operatorListboxId}>
            {operators.map((op) => (
              <SelectItem className="lowercase" key={op.value} value={op.value}>
                {op.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="min-w-36 max-w-60 flex-1">
          {needsValue && column ? (
            <DataGridFilterInput
              column={column}
              dir={dir}
              endValue={filterValue?.endValue}
              inputId={inputId}
              key={filter.id}
              onEndValueChange={onEndValueChange}
              onValueChange={onValueChange}
              operator={operator}
              value={filterValue?.value}
              variant={variant}
            />
          ) : (
            <div
              aria-label={`${columnLabels.get(filter.id)} filter is empty`}
              aria-live="polite"
              className="h-8 w-full rounded border bg-transparent dark:bg-input/30"
              id={inputId}
              role="status"
            />
          )}
        </div>
        <Button
          aria-controls={filterItemId}
          className="size-8 rounded"
          onClick={() => onFilterRemove(filter.id)}
          size="icon"
          variant="outline"
        >
          <Trash2 />
        </Button>
        <SortableItemHandle asChild>
          <Button className="size-8 rounded" size="icon" variant="outline">
            <GripVertical />
          </Button>
        </SortableItemHandle>
      </div>
    </SortableItem>
  );
}

interface DataGridFilterInputProps<TData> {
  variant: string;
  operator: FilterOperator;
  dir: "ltr" | "rtl";
  placeholder?: string;
  value: string | number | string[] | undefined;
  endValue?: string | number;
  column: Column<TData>;
  inputId: string;
  onValueChange: (value: string | number | string[] | undefined) => void;
  onEndValueChange?: (value: string | number | string[] | undefined) => void;
}

function DataGridFilterInput<TData>({
  variant,
  operator,
  dir,
  placeholder = "Value",
  value,
  endValue,
  column,
  inputId,
  onValueChange,
  onEndValueChange,
}: DataGridFilterInputProps<TData>) {
  const [showValueSelector, setShowValueSelector] = React.useState(false);
  const [localValue, setLocalValue] = React.useState(value);
  const [localEndValue, setLocalEndValue] = React.useState(endValue);

  const debouncedOnChange = useDebouncedCallback(
    (newValue: string | number | string[] | undefined) => {
      onValueChange(newValue);
    },
    FILTER_DEBOUNCE_MS
  );

  const debouncedOnEndValueChange = useDebouncedCallback(
    (newValue: string | number | string[] | undefined) => {
      onEndValueChange?.(newValue);
    },
    FILTER_DEBOUNCE_MS
  );

  const cellVariant = column.columnDef.meta?.cell;

  const selectOptions = React.useMemo(() => {
    return cellVariant?.variant === "select" ||
      cellVariant?.variant === "multi-select"
      ? cellVariant.options
      : [];
  }, [cellVariant]);

  const isBetween = operator === "isBetween";

  if (variant === "number") {
    if (isBetween) {
      return (
        <div className="flex gap-2">
          <Input
            className="h-8 w-full flex-1 rounded"
            id={inputId}
            inputMode="numeric"
            onChange={(event) => {
              const val = event.target.value;
              const newValue = val === "" ? undefined : Number(val);
              setLocalValue(newValue);
              debouncedOnChange(newValue);
            }}
            placeholder="Start"
            type="number"
            value={(localValue as number | undefined) ?? ""}
          />
          <Input
            className="h-8 w-full flex-1 rounded"
            id={`${inputId}-end`}
            inputMode="numeric"
            onChange={(event) => {
              const val = event.target.value;
              const newValue = val === "" ? undefined : Number(val);
              setLocalEndValue(newValue);
              debouncedOnEndValueChange(newValue);
            }}
            placeholder="End"
            type="number"
            value={(localEndValue as number | undefined) ?? ""}
          />
        </div>
      );
    }

    return (
      <Input
        className="h-8 w-full rounded"
        id={inputId}
        inputMode="numeric"
        onChange={(event) => {
          const val = event.target.value;
          const newValue = val === "" ? undefined : Number(val);
          setLocalValue(newValue);
          debouncedOnChange(newValue);
        }}
        placeholder={placeholder}
        type="number"
        value={(localValue as number | undefined) ?? ""}
      />
    );
  }

  if (variant === "date") {
    const inputListboxId = `${inputId}-listbox`;

    if (isBetween) {
      const startDate =
        localValue && typeof localValue === "string"
          ? new Date(localValue)
          : undefined;
      const endDate =
        localEndValue && typeof localEndValue === "string"
          ? new Date(localEndValue)
          : undefined;

      const isSameDate =
        startDate &&
        endDate &&
        startDate.toDateString() === endDate.toDateString();

      const displayValue =
        startDate && endDate && !isSameDate
          ? `${formatDate(startDate, { month: "short" })} - ${formatDate(endDate, { month: "short" })}`
          : startDate
            ? formatDate(startDate, { month: "short" })
            : "Pick a range";

      return (
        <Popover onOpenChange={setShowValueSelector} open={showValueSelector}>
          <PopoverTrigger asChild>
            <Button
              aria-controls={inputListboxId}
              className={cn(
                "h-8 w-full justify-start rounded font-normal",
                !startDate && "text-muted-foreground"
              )}
              dir={dir}
              id={inputId}
              size="sm"
              variant="outline"
            >
              <CalendarIcon />
              <span className="truncate">{displayValue}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-auto p-0"
            dir={dir}
            id={inputListboxId}
          >
            <Calendar
              autoFocus
              captionLayout="dropdown"
              mode="range"
              onSelect={(range) => {
                const fromValue = range?.from
                  ? range.from.toISOString()
                  : undefined;
                const toValue = range?.to ? range.to.toISOString() : undefined;
                setLocalValue(fromValue);
                setLocalEndValue(toValue);
                onValueChange(fromValue);
                onEndValueChange?.(toValue);
              }}
              selected={
                startDate && endDate
                  ? { from: startDate, to: endDate }
                  : startDate
                    ? { from: startDate, to: startDate }
                    : undefined
              }
            />
          </PopoverContent>
        </Popover>
      );
    }

    const dateValue =
      localValue && typeof localValue === "string"
        ? new Date(localValue)
        : undefined;

    return (
      <Popover onOpenChange={setShowValueSelector} open={showValueSelector}>
        <PopoverTrigger asChild>
          <Button
            aria-controls={inputListboxId}
            className={cn(
              "h-8 w-full justify-start rounded font-normal",
              !dateValue && "text-muted-foreground"
            )}
            dir={dir}
            id={inputId}
            size="sm"
            variant="outline"
          >
            <CalendarIcon />
            <span className="truncate">
              {dateValue
                ? formatDate(dateValue, { month: "short" })
                : "Pick a date"}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-auto p-0"
          dir={dir}
          id={inputListboxId}
        >
          <Calendar
            autoFocus
            captionLayout="dropdown"
            mode="single"
            onSelect={(date) => {
              const newValue = date ? date.toISOString() : undefined;
              setLocalValue(newValue);
              onValueChange(newValue);
              setShowValueSelector(false);
            }}
            selected={dateValue}
          />
        </PopoverContent>
      </Popover>
    );
  }

  const isSelectVariant = variant === "select" || variant === "multi-select";
  const isMultiValueOperator =
    operator === "isAnyOf" || operator === "isNoneOf";

  if (isSelectVariant && selectOptions.length > 0) {
    const inputListboxId = `${inputId}-listbox`;

    if (isMultiValueOperator) {
      const selectedValues = Array.isArray(value) ? value : [];
      const selectedOptions = selectOptions.filter((option) =>
        selectedValues.includes(option.value)
      );

      const selectedOptionsWithIcons = selectedOptions.filter(
        (selectedOption) => selectedOption.icon
      );

      return (
        <Popover onOpenChange={setShowValueSelector} open={showValueSelector}>
          <PopoverTrigger asChild>
            <Button
              aria-controls={inputListboxId}
              className="h-8 w-full justify-start rounded font-normal"
              dir={dir}
              id={inputId}
              size="sm"
              variant="outline"
            >
              {selectedOptions.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : (
                <>
                  {selectedOptionsWithIcons.length > 0 && (
                    <div className="flex items-center -space-x-2 rtl:space-x-reverse">
                      {selectedOptionsWithIcons.map(
                        (selectedOption) =>
                          selectedOption.icon && (
                            <div
                              className="rounded-full border bg-background p-0.5"
                              key={selectedOption.value}
                            >
                              <selectedOption.icon className="size-3.5" />
                            </div>
                          )
                      )}
                    </div>
                  )}
                  <span className="truncate">
                    {selectedOptions.length > 1
                      ? `${selectedOptions.length} selected`
                      : selectedOptions[0]?.label}
                  </span>
                </>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-48 p-0"
            dir={dir}
            id={inputListboxId}
          >
            <Command>
              <CommandInput placeholder="Search options..." />
              <CommandList>
                <CommandEmpty>No options found.</CommandEmpty>
                <CommandGroup>
                  {selectOptions.map((option) => {
                    const isSelected = selectedValues.includes(option.value);
                    return (
                      <CommandItem
                        key={option.value}
                        onSelect={() => {
                          const newValues = isSelected
                            ? selectedValues.filter((v) => v !== option.value)
                            : [...selectedValues, option.value];
                          onValueChange(
                            newValues.length > 0 ? newValues : undefined
                          );
                        }}
                        value={option.value}
                      >
                        {option.icon && <option.icon />}
                        <span className="truncate">{option.label}</span>
                        {option.count && (
                          <span className="ms-auto font-mono text-xs">
                            {option.count}
                          </span>
                        )}
                        <Check
                          className={cn(
                            "ms-auto",
                            isSelected ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      );
    }

    const selectedOption = selectOptions.find(
      (opt) => opt.value === (value as string)
    );

    return (
      <Popover onOpenChange={setShowValueSelector} open={showValueSelector}>
        <PopoverTrigger asChild>
          <Button
            aria-controls={inputListboxId}
            className="h-8 w-full justify-start rounded font-normal"
            dir={dir}
            id={inputId}
            size="sm"
            variant="outline"
          >
            {selectedOption ? (
              <>
                {selectedOption.icon && <selectedOption.icon />}
                <span className="truncate">{selectedOption.label}</span>
              </>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[200px] p-0"
          dir={dir}
          id={inputListboxId}
        >
          <Command>
            <CommandInput placeholder="Search options..." />
            <CommandList>
              <CommandEmpty>No options found.</CommandEmpty>
              <CommandGroup>
                {selectOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      onValueChange(option.value);
                      setShowValueSelector(false);
                    }}
                    value={option.value}
                  >
                    {option.icon && <option.icon />}
                    <span className="truncate">{option.label}</span>
                    {option.count && (
                      <span className="ms-auto font-mono text-xs">
                        {option.count}
                      </span>
                    )}
                    <Check
                      className={cn(
                        "ms-auto",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }

  if (isBetween) {
    return (
      <div className="flex gap-2">
        <Input
          className="h-8 w-full flex-1 rounded"
          id={inputId}
          onChange={(event) => {
            const val = event.target.value;
            const newValue = val === "" ? undefined : val;
            setLocalValue(newValue);
            debouncedOnChange(newValue);
          }}
          placeholder="Start"
          type="text"
          value={(localValue as string | undefined) ?? ""}
        />
        <Input
          className="h-8 w-full flex-1 rounded"
          id={`${inputId}-end`}
          onChange={(event) => {
            const val = event.target.value;
            const newValue = val === "" ? undefined : val;
            setLocalEndValue(newValue);
            debouncedOnEndValueChange(newValue);
          }}
          placeholder="End"
          type="text"
          value={(localEndValue as string | undefined) ?? ""}
        />
      </div>
    );
  }

  return (
    <Input
      className="h-8 w-full rounded"
      id={inputId}
      onChange={(event) => {
        const val = event.target.value;
        const newValue = val === "" ? undefined : val;
        setLocalValue(newValue);
        debouncedOnChange(newValue);
      }}
      placeholder={placeholder}
      type="text"
      value={(localValue as string | undefined) ?? ""}
    />
  );
}
