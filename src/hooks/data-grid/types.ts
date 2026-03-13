import type { ColumnDef, Table } from "@tanstack/react-table";
import type { Virtualizer } from "@tanstack/react-virtual";

import type {
  CellPosition,
  CellUpdate,
  Direction,
  RowHeightValue,
} from "@/types/data-grid";

export interface DataGridState {
  columnFilters: import("@tanstack/react-table").ColumnFiltersState;
  contextMenu: import("@/types/data-grid").ContextMenuState;
  cutCells: Set<string>;
  editingCell: CellPosition | null;
  focusedCell: CellPosition | null;
  lastClickedRowIndex: number | null;
  matchIndex: number;
  pasteDialog: import("@/types/data-grid").PasteDialogState;
  rowHeight: RowHeightValue;
  rowSelection: import("@tanstack/react-table").RowSelectionState;
  searchMatches: CellPosition[];
  searchOpen: boolean;
  searchQuery: string;
  selectionState: import("@/types/data-grid").SelectionState;
  sorting: import("@tanstack/react-table").SortingState;
}

export interface DataGridStore {
  batch: (fn: () => void) => void;
  getState: () => DataGridState;
  notify: () => void;
  setState: <K extends keyof DataGridState>(
    key: K,
    value: DataGridState[K]
  ) => void;
  subscribe: (callback: () => void) => () => void;
}

export interface DataGridContext<TData> {
  cellMapRef: React.RefObject<Map<string, HTMLDivElement>>;
  columnIds: string[];
  dataGridRef: React.RefObject<HTMLDivElement | null>;
  dir: Direction;
  focusGuardRef: React.MutableRefObject<boolean>;
  footerRef: React.RefObject<HTMLDivElement | null>;
  headerRef: React.RefObject<HTMLDivElement | null>;
  navigableColumnIds: string[];
  propsRef: React.MutableRefObject<{
    data: TData[];
    columns: ColumnDef<TData, unknown>[];
    readOnly?: boolean;
    enableSingleCellSelection?: boolean;
    enableColumnSelection?: boolean;
    enableSearch?: boolean;
    enablePaste?: boolean;
    onDataChange?: (data: TData[]) => void;
    onRowAdd?: (
      event?: React.MouseEvent<HTMLDivElement>
    ) => Partial<CellPosition> | Promise<Partial<CellPosition> | null> | null;
    onRowsAdd?: (count: number) => void | Promise<void>;
    onRowsDelete?: (
      rows: TData[],
      rowIndices: number[]
    ) => void | Promise<void>;
    onPaste?: (updates: CellUpdate[]) => void | Promise<void>;
    onFilesUpload?: (params: {
      files: File[];
      rowIndex: number;
      columnId: string;
    }) => Promise<import("@/types/data-grid").FileCellData[]>;
    onFilesDelete?: (params: {
      fileIds: string[];
      rowIndex: number;
      columnId: string;
    }) => void | Promise<void>;
    onRowHeightChange?: (rowHeight: RowHeightValue) => void;
    onSortingChange?: (
      sorting: import("@tanstack/react-table").SortingState
    ) => void;
    onColumnFiltersChange?: (
      filters: import("@tanstack/react-table").ColumnFiltersState
    ) => void;
    autoFocus?: boolean | Partial<CellPosition>;
    meta?: import("@tanstack/react-table").TableMeta<TData>;
    initialState?: import("@tanstack/react-table").InitialTableState;
    state?: Partial<import("@tanstack/react-table").TableState>;
  }>;
  rowMapRef: React.RefObject<Map<number, HTMLDivElement>>;
  rowVirtualizerRef: React.MutableRefObject<Virtualizer<
    HTMLDivElement,
    Element
  > | null>;
  stateRef: React.MutableRefObject<DataGridState>;
  store: DataGridStore;
  tableRef: React.MutableRefObject<Table<TData> | null>;
}
