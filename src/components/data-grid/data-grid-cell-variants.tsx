"use client";

import { Check, Upload, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { DataGridCellWrapper } from "@/components/data-grid/data-grid-cell-wrapper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useBadgeOverflow } from "@/hooks/use-badge-overflow";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import {
  formatDateForDisplay,
  formatDateToString,
  formatFileSize,
  getCellKey,
  getFileIcon,
  getLineCount,
  getUrlHref,
  parseLocalDate,
} from "@/lib/data-grid";
import { cn } from "@/lib/utils";
import type { DataGridCellProps, FileCellData } from "@/types/data-grid";

type CellEditDirection = "left" | "right";
type DataGridTableMeta = DataGridCellProps<unknown>["tableMeta"];

interface RejectedUploadFile {
  name: string;
  reason: string;
}

interface UploadValidationResult {
  filesToUpload: File[];
  rejectedFiles: RejectedUploadFile[];
}

const FILE_NAME_PREVIEW_LENGTH = 20;
const FILE_ERROR_RESET_DELAY_MS = 2000;

function isTypingKey(event: React.KeyboardEvent) {
  return event.key.length === 1 && !event.ctrlKey && !event.metaKey;
}

function commitCellValue<TValue>({
  tableMeta,
  rowIndex,
  columnId,
  currentValue,
  previousValue,
  readOnly,
  stopOptions,
}: {
  tableMeta: DataGridTableMeta;
  rowIndex: number;
  columnId: string;
  currentValue: TValue;
  previousValue: TValue;
  readOnly: boolean;
  stopOptions?: {
    moveToNextRow?: boolean;
    direction?: CellEditDirection;
  };
}) {
  if (!readOnly && currentValue !== previousValue) {
    tableMeta?.onDataUpdate?.({
      rowIndex,
      columnId,
      value: currentValue,
    });
  }
  tableMeta?.onCellEditingStop?.(stopOptions);
}

function prefillEditableCell({
  event,
  cellRef,
  setValue,
}: {
  event: React.KeyboardEvent<HTMLDivElement>;
  cellRef: React.RefObject<HTMLDivElement | null>;
  setValue: (value: string) => void;
}) {
  setValue(event.key);

  queueMicrotask(() => {
    if (cellRef.current && cellRef.current.contentEditable === "true") {
      cellRef.current.textContent = event.key;
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(cellRef.current);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  });
}

function handleNumberCellKeyDown({
  event,
  isEditing,
  isFocused,
  value,
  initialValue,
  tableMeta,
  rowIndex,
  columnId,
  readOnly,
  onSetValue,
  inputRef,
}: {
  event: React.KeyboardEvent<HTMLDivElement>;
  isEditing: boolean;
  isFocused: boolean;
  value: string;
  initialValue: number;
  tableMeta: DataGridTableMeta;
  rowIndex: number;
  columnId: string;
  readOnly: boolean;
  onSetValue: (value: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  if (!isEditing) {
    if (!isFocused) {
      return;
    }

    if (event.key === "Backspace") {
      onSetValue("");
      return;
    }

    if (isTypingKey(event)) {
      onSetValue(event.key);
    }
    return;
  }

  const numValue = value === "" ? null : Number(value);
  if (event.key === "Enter") {
    event.preventDefault();
    commitCellValue({
      tableMeta,
      rowIndex,
      columnId,
      currentValue: numValue,
      previousValue: initialValue,
      readOnly,
      stopOptions: { moveToNextRow: true },
    });
    return;
  }

  if (event.key === "Tab") {
    event.preventDefault();
    commitCellValue({
      tableMeta,
      rowIndex,
      columnId,
      currentValue: numValue,
      previousValue: initialValue,
      readOnly,
      stopOptions: { direction: event.shiftKey ? "left" : "right" },
    });
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    onSetValue(String(initialValue ?? ""));
    inputRef.current?.blur();
  }
}

function handleUrlCellKeyDown({
  event,
  isEditing,
  isFocused,
  initialValue,
  tableMeta,
  rowIndex,
  columnId,
  readOnly,
  onSetValue,
  cellRef,
}: {
  event: React.KeyboardEvent<HTMLDivElement>;
  isEditing: boolean;
  isFocused: boolean;
  initialValue: string;
  tableMeta: DataGridTableMeta;
  rowIndex: number;
  columnId: string;
  readOnly: boolean;
  onSetValue: (value: string) => void;
  cellRef: React.RefObject<HTMLDivElement | null>;
}) {
  const getCurrentValue = () => cellRef.current?.textContent?.trim() ?? "";

  if (!isEditing) {
    if (!isFocused || readOnly || !isTypingKey(event)) {
      return;
    }
    prefillEditableCell({ event, cellRef, setValue: onSetValue });
    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    const currentValue = getCurrentValue();
    commitCellValue({
      tableMeta,
      rowIndex,
      columnId,
      currentValue: currentValue || null,
      previousValue: initialValue ?? null,
      readOnly,
      stopOptions: { moveToNextRow: true },
    });
    return;
  }

  if (event.key === "Tab") {
    event.preventDefault();
    const currentValue = getCurrentValue();
    commitCellValue({
      tableMeta,
      rowIndex,
      columnId,
      currentValue: currentValue || null,
      previousValue: initialValue ?? null,
      readOnly,
      stopOptions: { direction: event.shiftKey ? "left" : "right" },
    });
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    onSetValue(initialValue ?? "");
    cellRef.current?.blur();
  }
}

function splitValidatedFiles(
  files: File[],
  validateFile: (file: File) => string | null
): UploadValidationResult {
  const filesToUpload: File[] = [];
  const rejectedFiles: RejectedUploadFile[] = [];

  for (const file of files) {
    const validationError = validateFile(file);
    if (validationError) {
      rejectedFiles.push({ name: file.name, reason: validationError });
      continue;
    }
    filesToUpload.push(file);
  }

  return { filesToUpload, rejectedFiles };
}

function getTruncatedFileName(name: string): string {
  return name.length > FILE_NAME_PREVIEW_LENGTH
    ? `${name.slice(0, FILE_NAME_PREVIEW_LENGTH)}...`
    : name;
}

function createTempFileData(files: File[]): FileCellData[] {
  return files.map((file) => ({
    id: crypto.randomUUID(),
    name: file.name,
    size: file.size,
    type: file.type,
    url: undefined,
  }));
}

function createUploadedFileData(
  files: File[],
  tempFiles: FileCellData[]
): FileCellData[] {
  return files.map((file, index) => ({
    id: tempFiles[index]?.id ?? crypto.randomUUID(),
    name: file.name,
    size: file.size,
    type: file.type,
    url: URL.createObjectURL(file),
  }));
}

function createBlobFileData(files: File[]): FileCellData[] {
  return files.map((file) => ({
    id: crypto.randomUUID(),
    name: file.name,
    size: file.size,
    type: file.type,
    url: URL.createObjectURL(file),
  }));
}

function finalizeUploadedFiles(
  previousFiles: FileCellData[],
  uploadingFileIds: Set<string>,
  uploadedFiles: FileCellData[]
): FileCellData[] {
  return previousFiles
    .map((file) => {
      if (!uploadingFileIds.has(file.id)) {
        return file;
      }
      return (
        uploadedFiles.find((uploadedFile) => uploadedFile.name === file.name) ??
        file
      );
    })
    .filter((file) => file.url !== undefined);
}

function getFileUploadDescription(
  maxFileSize: number | undefined,
  maxFiles: number | undefined
): string {
  if (maxFileSize) {
    const suffix = maxFiles ? ` • Max ${maxFiles} files` : "";
    return `Max size: ${formatFileSize(maxFileSize)}${suffix}`;
  }
  if (maxFiles) {
    return `Max ${maxFiles} files`;
  }
  return "Select files to upload";
}

function getFileUploadRejectionMessage(
  rejectedFiles: RejectedUploadFile[]
): { message: string; description: string } | null {
  if (rejectedFiles.length === 0) {
    return null;
  }

  const firstError = rejectedFiles[0];
  if (!firstError) {
    return null;
  }

  const truncatedName = getTruncatedFileName(firstError.name);
  if (rejectedFiles.length === 1) {
    return {
      message: firstError.reason,
      description: `"${truncatedName}" has been rejected`,
    };
  }

  return {
    message: firstError.reason,
    description: `"${truncatedName}" and ${rejectedFiles.length - 1} more rejected`,
  };
}

function getFileUploadError(error: unknown, fileCount: number): string {
  return error instanceof Error
    ? error.message
    : `Failed to upload ${fileCount} file${fileCount !== 1 ? "s" : ""}`;
}

async function resolveUploadedFiles({
  filesToUpload,
  tableMeta,
  rowIndex,
  columnId,
  tempFiles,
}: {
  filesToUpload: File[];
  tableMeta: DataGridTableMeta | null | undefined;
  rowIndex: number;
  columnId: string;
  tempFiles: FileCellData[];
}): Promise<FileCellData[]> {
  if (tableMeta?.onFilesUpload) {
    return await tableMeta.onFilesUpload({
      files: filesToUpload,
      rowIndex,
      columnId,
    });
  }
  return createUploadedFileData(filesToUpload, tempFiles);
}

interface AddFilesContext {
  newFiles: File[];
  skipUpload: boolean;
  files: FileCellData[];
  maxFiles: number;
  readOnly: boolean;
  isPending: boolean;
  validateFile: (file: File) => string | null;
  showFileUploadError: (message: string, description?: string) => void;
  tableMeta: DataGridTableMeta | null | undefined;
  rowIndex: number;
  columnId: string;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setFiles: React.Dispatch<React.SetStateAction<FileCellData[]>>;
  setUploadingFiles: React.Dispatch<React.SetStateAction<Set<string>>>;
}

async function handleAddFiles({
  newFiles,
  skipUpload,
  files,
  maxFiles,
  readOnly,
  isPending,
  validateFile,
  showFileUploadError,
  tableMeta,
  rowIndex,
  columnId,
  setError,
  setFiles,
  setUploadingFiles,
}: AddFilesContext) {
  if (readOnly || isPending) {
    return;
  }

  setError(null);

  if (maxFiles && files.length + newFiles.length > maxFiles) {
    showFileUploadError(`Maximum ${maxFiles} files allowed`);
    return;
  }

  const { filesToUpload, rejectedFiles } = splitValidatedFiles(
    newFiles,
    validateFile
  );

  const rejectionMessage = getFileUploadRejectionMessage(rejectedFiles);
  if (rejectionMessage) {
    showFileUploadError(rejectionMessage.message, rejectionMessage.description);
  }

  if (filesToUpload.length === 0) {
    return;
  }

  if (skipUpload) {
    const uploadedFiles = createBlobFileData(filesToUpload);
    const updatedFiles = [...files, ...uploadedFiles];
    setFiles(updatedFiles);
    tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: updatedFiles });
    return;
  }

  const tempFiles = createTempFileData(filesToUpload);
  const filesWithTemp = [...files, ...tempFiles];
  setFiles(filesWithTemp);

  const uploadingIds = new Set<string>(tempFiles.map((file) => file.id));
  setUploadingFiles(uploadingIds);

  try {
    const uploadedFiles = await resolveUploadedFiles({
      filesToUpload,
      tableMeta,
      rowIndex,
      columnId,
      tempFiles,
    });
    const finalFiles = finalizeUploadedFiles(
      filesWithTemp,
      uploadingIds,
      uploadedFiles
    );

    setFiles(finalFiles);
    tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: finalFiles });
  } catch (error) {
    toast.error(getFileUploadError(error, filesToUpload.length));
    setFiles((prev) => prev.filter((f) => !uploadingIds.has(f.id)));
  } finally {
    setUploadingFiles(new Set());
  }
}

interface RemoveFileContext {
  fileId: string;
  readOnly: boolean;
  isPending: boolean;
  files: FileCellData[];
  tableMeta: DataGridTableMeta | null | undefined;
  rowIndex: number;
  columnId: string;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setDeletingFiles: React.Dispatch<React.SetStateAction<Set<string>>>;
  setFiles: React.Dispatch<React.SetStateAction<FileCellData[]>>;
}

async function handleRemoveFile({
  fileId,
  readOnly,
  isPending,
  files,
  tableMeta,
  rowIndex,
  columnId,
  setError,
  setDeletingFiles,
  setFiles,
}: RemoveFileContext) {
  if (readOnly || isPending) {
    return;
  }

  setError(null);

  const fileToRemove = files.find((f) => f.id === fileId);
  if (!fileToRemove) {
    return;
  }

  setDeletingFiles((prev) => new Set(prev).add(fileId));

  if (tableMeta?.onFilesDelete) {
    try {
      await tableMeta.onFilesDelete({
        fileIds: [fileId],
        rowIndex,
        columnId,
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : `Failed to delete ${fileToRemove.name}`
      );
      setDeletingFiles((prev) => {
        const next = new Set(prev);
        next.delete(fileId);
        return next;
      });
      return;
    }
  }

  if (fileToRemove.url?.startsWith("blob:")) {
    URL.revokeObjectURL(fileToRemove.url);
  }

  const updatedFiles = files.filter((f) => f.id !== fileId);
  setFiles(updatedFiles);
  setDeletingFiles((prev) => {
    const next = new Set(prev);
    next.delete(fileId);
    return next;
  });
  tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: updatedFiles });
}

interface ClearAllFilesContext {
  readOnly: boolean;
  isPending: boolean;
  files: FileCellData[];
  tableMeta: DataGridTableMeta | null | undefined;
  rowIndex: number;
  columnId: string;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setDeletingFiles: React.Dispatch<React.SetStateAction<Set<string>>>;
  setFiles: React.Dispatch<React.SetStateAction<FileCellData[]>>;
}

async function handleClearAllFiles({
  readOnly,
  isPending,
  files,
  tableMeta,
  rowIndex,
  columnId,
  setError,
  setDeletingFiles,
  setFiles,
}: ClearAllFilesContext) {
  if (readOnly || isPending) {
    return;
  }

  setError(null);

  const fileIds = files.map((f) => f.id);
  setDeletingFiles(new Set(fileIds));

  if (tableMeta?.onFilesDelete && files.length > 0) {
    try {
      await tableMeta.onFilesDelete({
        fileIds,
        rowIndex,
        columnId,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete files"
      );
      setDeletingFiles(new Set());
      return;
    }
  }

  for (const file of files) {
    if (file.url?.startsWith("blob:")) {
      URL.revokeObjectURL(file.url);
    }
  }

  setFiles([]);
  setDeletingFiles(new Set());
  tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: [] });
}

interface DragLeaveContext {
  event: React.DragEvent;
  isDraggingStateSetter: (value: boolean) => void;
}

function updateDragStateOnLeave({
  event,
  isDraggingStateSetter,
}: DragLeaveContext) {
  event.preventDefault();
  event.stopPropagation();

  const rect = event.currentTarget.getBoundingClientRect();
  const x = event.clientX;
  const y = event.clientY;

  if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
    isDraggingStateSetter(false);
  }
}

function handleFileWrapperKeyDown({
  event,
  isEditing,
  isFocused,
  cellValue,
  tableMeta,
  rowIndex,
  columnId,
  stopNavigation,
  onDropzoneClick,
  setFiles,
  setError,
}: {
  event: React.KeyboardEvent<HTMLDivElement>;
  isEditing: boolean;
  isFocused: boolean;
  cellValue: FileCellData[];
  tableMeta: DataGridTableMeta;
  rowIndex: number;
  columnId: string;
  stopNavigation: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  onDropzoneClick: () => void;
  setFiles: React.Dispatch<React.SetStateAction<FileCellData[]>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  if (isEditing) {
    if (event.key === "Escape") {
      event.preventDefault();
      setFiles(cellValue);
      setError(null);
      tableMeta?.onCellEditingStop?.();
      return;
    }
    if (event.key === " ") {
      event.preventDefault();
      onDropzoneClick();
      return;
    }
    if (event.key === "Tab") {
      stopNavigation(event);
    }
    return;
  }

  if (!isFocused) {
    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    tableMeta?.onCellEditingStart?.(rowIndex, columnId);
    return;
  }

  if (event.key === "Tab") {
    stopNavigation(event);
  }
}

interface FileCellStateSyncContext {
  cellValue: FileCellData[];
  files: FileCellData[];
  cellKey: string;
  prevCellValueRef: React.RefObject<FileCellData[]>;
  prevCellKeyRef: React.RefObject<string>;
  setFiles: React.Dispatch<React.SetStateAction<FileCellData[]>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

function syncFileCellState({
  cellValue,
  files,
  cellKey,
  prevCellValueRef,
  prevCellKeyRef,
  setFiles,
  setError,
}: FileCellStateSyncContext) {
  if (cellValue !== prevCellValueRef.current) {
    prevCellValueRef.current = cellValue;
    revokeTrackedFiles(files);

    setFiles(cellValue);
    setError(null);
  }

  if (prevCellKeyRef.current !== cellKey) {
    prevCellKeyRef.current = cellKey;
    setError(null);
  }
}

function handleFileDropToCell({
  event,
  addFiles,
  setIsDraggingOver,
}: {
  event: React.DragEvent;
  addFiles: (newFiles: File[], skipUpload?: boolean) => Promise<void>;
  setIsDraggingOver: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  event.preventDefault();
  event.stopPropagation();
  setIsDraggingOver(false);
  const droppedFiles = Array.from(event.dataTransfer.files);
  addFiles(droppedFiles, false);
}

function handleDropzoneFileDrop({
  event,
  addFiles,
  setIsDragging,
}: {
  event: React.DragEvent;
  addFiles: (newFiles: File[], skipUpload?: boolean) => Promise<void>;
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  event.preventDefault();
  event.stopPropagation();
  setIsDragging(false);
  const droppedFiles = Array.from(event.dataTransfer.files);
  addFiles(droppedFiles, false);
}

function handleFileDragOver(event: React.DragEvent) {
  event.preventDefault();
  event.stopPropagation();
}

interface DropzoneCellEnterContext {
  event: React.DragEvent;
  setIsDragging: (value: boolean) => void;
  allowFilesOnly?: boolean;
}

function handleDropzoneCellEnter({
  event,
  setIsDragging,
  allowFilesOnly = false,
}: DropzoneCellEnterContext) {
  event.preventDefault();
  event.stopPropagation();
  if (allowFilesOnly && !event.dataTransfer.types.includes("Files")) {
    return;
  }
  setIsDragging(true);
}

function handleDropzoneCellOpen({
  open,
  readOnly,
  rowIndex,
  columnId,
  tableMeta,
  setError,
}: {
  open: boolean;
  readOnly: boolean;
  rowIndex: number;
  columnId: string;
  tableMeta: DataGridTableMeta;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  if (open && !readOnly) {
    setError(null);
    tableMeta?.onCellEditingStart?.(rowIndex, columnId);
    return;
  }

  setError(null);
  tableMeta?.onCellEditingStop?.();
}

function focusDropzoneOnOpen(
  isEditing: boolean,
  dropzoneRef: React.RefObject<HTMLDivElement | null>
) {
  if (!isEditing) {
    return;
  }

  queueMicrotask(() => {
    dropzoneRef.current?.focus();
  });
}

function revokeTrackedFiles(files: FileCellData[]) {
  for (const file of files) {
    if (file.url) {
      URL.revokeObjectURL(file.url);
    }
  }
}

function getFileListStatus(
  file: FileCellData,
  isUploading: boolean,
  isDeleting: boolean
) {
  let fileStatus = formatFileSize(file.size);
  if (isUploading) {
    fileStatus = "Uploading...";
  } else if (isDeleting) {
    fileStatus = "Deleting...";
  }
  return fileStatus;
}

function getFileValidationResult({
  file,
  maxFileSize,
  acceptedTypes,
}: {
  file: File;
  maxFileSize: number | undefined;
  acceptedTypes: string[] | null;
}): string | null {
  if (maxFileSize && file.size > maxFileSize) {
    return `File size exceeds ${formatFileSize(maxFileSize)}`;
  }

  if (!acceptedTypes) {
    return null;
  }

  const fileExtension = `.${file.name.split(".").pop()}`;
  const isAccepted = acceptedTypes.some((type) => {
    if (type.endsWith("/*")) {
      const baseType = type.slice(0, -2);
      return file.type.startsWith(`${baseType}/`);
    }
    if (type.startsWith(".")) {
      return fileExtension.toLowerCase() === type.toLowerCase();
    }
    return file.type === type;
  });

  if (isAccepted) {
    return null;
  }
  return "File type not accepted";
}

function renderFileRow({
  file,
  uploadingFiles,
  deletingFiles,
  isPending,
  onRemove,
}: {
  file: FileCellData;
  uploadingFiles: Set<string>;
  deletingFiles: Set<string>;
  isPending: boolean;
  onRemove: (fileId: string) => void;
}) {
  const FileIcon = getFileIcon(file.type);
  const isFileUploading = uploadingFiles.has(file.id);
  const isFileDeleting = deletingFiles.has(file.id);
  const fileStatus = getFileListStatus(file, isFileUploading, isFileDeleting);

  return (
    <div
      className="flex items-center gap-2 rounded-md border bg-muted/50 px-2 py-1.5 data-pending:opacity-60"
      data-pending={isFileUploading || isFileDeleting ? "" : undefined}
      key={file.id}
    >
      {FileIcon && (
        <FileIcon className="size-4 shrink-0 text-muted-foreground" />
      )}
      <div className="flex-1 overflow-hidden">
        <p className="truncate text-sm">{file.name}</p>
        <p className="text-muted-foreground text-xs">{fileStatus}</p>
      </div>
      <Button
        className="size-5 rounded-sm"
        disabled={isPending}
        onClick={() => onRemove(file.id)}
        size="icon"
        type="button"
        variant="ghost"
      >
        <X className="size-3" />
      </Button>
    </div>
  );
}

function renderCompactFileBadge({
  file,
  uploadingFiles,
}: {
  file: FileCellData;
  uploadingFiles: Set<string>;
}) {
  const isUploading = uploadingFiles.has(file.id);
  if (isUploading) {
    return (
      <Skeleton
        className="h-5 shrink-0 px-1.5"
        key={file.id}
        style={{
          width: `${Math.min(file.name.length * 8 + 30, 100)}px`,
        }}
      />
    );
  }

  const FileIcon = getFileIcon(file.type);

  return (
    <Badge className="gap-1 px-1.5 py-px" key={file.id} variant="secondary">
      {FileIcon && <FileIcon className="size-3 shrink-0" />}
      <span className="max-w-[100px] truncate">{file.name}</span>
    </Badge>
  );
}

function handleDropzoneKeyDown({
  event,
  onDropzoneClick,
}: {
  event: React.KeyboardEvent<HTMLDivElement>;
  onDropzoneClick: () => void;
}) {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }
  event.preventDefault();
  onDropzoneClick();
}

function stopFileCellNavigation({
  event,
  tableMeta,
}: {
  event: React.KeyboardEvent<HTMLDivElement>;
  tableMeta: DataGridTableMeta;
}) {
  event.preventDefault();
  tableMeta?.onCellEditingStop?.({
    direction: event.shiftKey ? "left" : "right",
  });
}

interface FileCellPopoverContext {
  isEditing: boolean;
  onOpenChange: (open: boolean) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  sideOffset: number;
  labelId: string;
  descriptionId: string;
  onDropzoneClick: () => void;
  onDropzoneDragEnter: (event: React.DragEvent) => void;
  onDropzoneDragLeave: (event: React.DragEvent) => void;
  onDropzoneDragOver: (event: React.DragEvent) => void;
  onDropzoneDrop: (event: React.DragEvent) => void;
  onDropzoneKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  dropzoneRef: React.RefObject<HTMLDivElement | null>;
  isPending: boolean;
  isDragging: boolean;
  error: string | null;
  accept: string | undefined;
  multiple: boolean;
  onFileInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  files: FileCellData[];
  clearAll: () => void;
  removeFile: (fileId: string) => void;
  uploadingFiles: Set<string>;
  deletingFiles: Set<string>;
  maxFileSize: number | undefined;
  maxFiles: number | undefined;
}

function renderFileCellPopover({
  isEditing,
  onOpenChange,
  containerRef,
  sideOffset,
  labelId,
  descriptionId,
  onDropzoneClick,
  onDropzoneDragEnter,
  onDropzoneDragLeave,
  onDropzoneDragOver,
  onDropzoneDrop,
  onDropzoneKeyDown,
  dropzoneRef,
  isPending,
  isDragging,
  error,
  accept,
  multiple,
  onFileInputChange,
  fileInputRef,
  files,
  clearAll,
  removeFile,
  uploadingFiles,
  deletingFiles,
  maxFileSize,
  maxFiles,
}: FileCellPopoverContext) {
  if (!isEditing) {
    return null;
  }

  return (
    <Popover onOpenChange={onOpenChange} open={isEditing}>
      <PopoverContent
        align="start"
        anchor={containerRef}
        className="w-[400px] rounded-none p-0"
        data-grid-cell-editor=""
        sideOffset={sideOffset}
      >
        <div className="flex flex-col gap-2 p-3">
          <span className="sr-only" id={labelId}>
            File upload
          </span>
          {/* biome-ignore lint/a11y/useSemanticElements: Drag-drop upload area uses role-based button behavior inside a contenteditable grid container. */}
          <div
            aria-describedby={descriptionId}
            aria-disabled={isPending}
            aria-invalid={!!error}
            aria-label="Upload files"
            aria-labelledby={labelId}
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-6 outline-none transition-colors hover:bg-accent/30 focus-visible:border-ring/50 data-disabled:pointer-events-none data-dragging:border-primary/30 data-invalid:border-destructive data-dragging:bg-accent/30 data-disabled:opacity-50 data-invalid:ring-destructive/20"
            data-disabled={isPending ? "" : undefined}
            data-dragging={isDragging ? "" : undefined}
            data-invalid={error ? "" : undefined}
            onClick={onDropzoneClick}
            onDragEnter={onDropzoneDragEnter}
            onDragLeave={onDropzoneDragLeave}
            onDragOver={onDropzoneDragOver}
            onDrop={onDropzoneDrop}
            onKeyDown={onDropzoneKeyDown}
            ref={dropzoneRef}
            role="button"
            tabIndex={isDragging || isPending ? -1 : 0}
          >
            <Upload className="size-8 text-muted-foreground" />
            <div className="text-center text-sm">
              <p className="font-medium">
                {isDragging ? "Drop files here" : "Drag files here"}
              </p>
              <p className="text-muted-foreground text-xs">
                or click to browse
              </p>
            </div>
            <p className="text-muted-foreground text-xs" id={descriptionId}>
              {getFileUploadDescription(maxFileSize, maxFiles)}
            </p>
          </div>
          <input
            accept={accept}
            aria-describedby={descriptionId}
            aria-labelledby={labelId}
            className="sr-only"
            multiple={multiple}
            onChange={onFileInputChange}
            ref={fileInputRef}
            type="file"
          />
          {files.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="font-medium text-muted-foreground text-xs">
                  {files.length} {files.length === 1 ? "file" : "files"}
                </p>
                <Button
                  className="h-6 text-muted-foreground text-xs"
                  disabled={isPending}
                  onClick={clearAll}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  Clear all
                </Button>
              </div>
              <div className="max-h-[200px] space-y-1 overflow-y-auto">
                {files.map((file) =>
                  renderFileRow({
                    file,
                    uploadingFiles,
                    deletingFiles,
                    isPending,
                    onRemove: removeFile,
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface FileCellSummaryContext {
  isDraggingOver: boolean;
  files: FileCellData[];
  visibleFiles: FileCellData[];
  hiddenFileCount: number;
  uploadingFiles: Set<string>;
}

function renderFileCellSummary({
  isDraggingOver,
  files,
  visibleFiles,
  hiddenFileCount,
  uploadingFiles,
}: FileCellSummaryContext) {
  if (isDraggingOver) {
    return (
      <div className="flex items-center justify-center gap-2 text-primary text-sm">
        <Upload className="size-4" />
        <span>Drop files here</span>
      </div>
    );
  }

  if (files.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1 overflow-hidden">
      {visibleFiles.map((file) =>
        renderCompactFileBadge({ file, uploadingFiles })
      )}
      {hiddenFileCount > 0 && (
        <Badge className="px-1.5 py-px text-muted-foreground" variant="outline">
          +{hiddenFileCount}
        </Badge>
      )}
    </div>
  );
}

export function ShortTextCell<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  rowHeight,
  isEditing,
  isFocused,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  readOnly,
}: DataGridCellProps<TData>) {
  const initialValue = cell.getValue() as string;
  const [value, setValue] = useState(initialValue);
  const cellRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const prevInitialValueRef = useRef(initialValue);
  if (initialValue !== prevInitialValueRef.current) {
    prevInitialValueRef.current = initialValue;
    setValue(initialValue);
    if (cellRef.current && !isEditing) {
      cellRef.current.textContent = initialValue;
    }
  }

  const onBlur = useCallback(() => {
    // Read the current value directly from the DOM to avoid stale state
    const currentValue = cellRef.current?.textContent ?? "";
    if (!readOnly && currentValue !== initialValue) {
      tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: currentValue });
    }
    tableMeta?.onCellEditingStop?.();
  }, [tableMeta, rowIndex, columnId, initialValue, readOnly]);

  const onInput = useCallback((event: React.FormEvent<HTMLDivElement>) => {
    const currentValue = event.currentTarget.textContent ?? "";
    setValue(currentValue);
  }, []);

  const onWrapperKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (isEditing) {
        if (event.key === "Enter") {
          event.preventDefault();
          commitCellValue({
            tableMeta,
            rowIndex,
            columnId,
            currentValue: cellRef.current?.textContent ?? "",
            previousValue: initialValue,
            readOnly,
            stopOptions: { moveToNextRow: true },
          });
        } else if (event.key === "Tab") {
          event.preventDefault();
          commitCellValue({
            tableMeta,
            rowIndex,
            columnId,
            currentValue: cellRef.current?.textContent ?? "",
            previousValue: initialValue,
            readOnly,
            stopOptions: { direction: event.shiftKey ? "left" : "right" },
          });
        } else if (event.key === "Escape") {
          event.preventDefault();
          setValue(initialValue);
          cellRef.current?.blur();
        }
      } else if (isFocused && isTypingKey(event)) {
        // Handle typing to pre-fill the value when editing starts
        prefillEditableCell({ event, cellRef, setValue });
      }
    },
    [
      isEditing,
      isFocused,
      initialValue,
      tableMeta,
      rowIndex,
      columnId,
      readOnly,
    ]
  );

  useEffect(() => {
    if (isEditing && cellRef.current) {
      cellRef.current.focus();

      if (!cellRef.current.textContent && value) {
        cellRef.current.textContent = value;
      }

      if (cellRef.current.textContent) {
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(cellRef.current);
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }
  }, [isEditing, value]);

  const displayValue = isEditing ? "" : (value ?? "");

  return (
    <DataGridCellWrapper<TData>
      cell={cell}
      columnId={columnId}
      isActiveSearchMatch={isActiveSearchMatch}
      isEditing={isEditing}
      isFocused={isFocused}
      isSearchMatch={isSearchMatch}
      isSelected={isSelected}
      onKeyDown={onWrapperKeyDown}
      readOnly={readOnly}
      ref={containerRef}
      rowHeight={rowHeight}
      rowIndex={rowIndex}
      tableMeta={tableMeta}
    >
      {/* biome-ignore lint/a11y/useSemanticElements: Editable content uses contentEditable and cannot be replaced by a semantic input while preserving virtualization layout. */}
      <div
        aria-multiline="false"
        className={cn("size-full overflow-hidden outline-none", {
          "whitespace-nowrap **:inline **:whitespace-nowrap [&_br]:hidden":
            isEditing,
        })}
        contentEditable={isEditing}
        data-slot="grid-cell-content"
        onBlur={onBlur}
        onInput={onInput}
        ref={cellRef}
        role="textbox"
        suppressContentEditableWarning
        tabIndex={-1}
      >
        {displayValue}
      </div>
    </DataGridCellWrapper>
  );
}

export function LongTextCell<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  rowHeight,
  isFocused,
  isEditing,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  readOnly,
}: DataGridCellProps<TData>) {
  const initialValue = cell.getValue() as string;
  const [value, setValue] = useState(initialValue ?? "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pendingCharRef = useRef<string | null>(null);
  const sideOffset = -(containerRef.current?.clientHeight ?? 0);

  const prevInitialValueRef = useRef(initialValue);
  if (initialValue !== prevInitialValueRef.current) {
    prevInitialValueRef.current = initialValue;
    setValue(initialValue ?? "");
  }

  const debouncedSave = useDebouncedCallback((newValue: string) => {
    if (!readOnly) {
      tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: newValue });
    }
  }, 300);

  const onSave = useCallback(() => {
    // Immediately save any pending changes and close the popover
    if (!readOnly && value !== initialValue) {
      tableMeta?.onDataUpdate?.({ rowIndex, columnId, value });
    }
    tableMeta?.onCellEditingStop?.();
  }, [tableMeta, value, initialValue, rowIndex, columnId, readOnly]);

  const onCancel = useCallback(() => {
    // Restore the original value
    setValue(initialValue ?? "");
    if (!readOnly) {
      tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: initialValue });
    }
    tableMeta?.onCellEditingStop?.();
  }, [tableMeta, initialValue, rowIndex, columnId, readOnly]);

  const onOpenChange = useCallback(
    (open: boolean) => {
      if (open && !readOnly) {
        tableMeta?.onCellEditingStart?.(rowIndex, columnId);
      } else {
        // Immediately save any pending changes when closing
        if (!readOnly && value !== initialValue) {
          tableMeta?.onDataUpdate?.({ rowIndex, columnId, value });
        }
        tableMeta?.onCellEditingStop?.();
      }
    },
    [tableMeta, value, initialValue, rowIndex, columnId, readOnly]
  );

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      const length = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(length, length);

      if (pendingCharRef.current) {
        const char = pendingCharRef.current;
        pendingCharRef.current = null;
        requestAnimationFrame(() => {
          if (
            textareaRef.current &&
            document.activeElement === textareaRef.current
          ) {
            document.execCommand("insertText", false, char);
            textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
          }
        });
      } else {
        textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
      }
    }
  }, [isEditing]);

  const onWrapperKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (
        isFocused &&
        !isEditing &&
        !readOnly &&
        event.key.length === 1 &&
        !event.ctrlKey &&
        !event.metaKey
      ) {
        // Store the character to be inserted after textarea focuses
        // This ensures it's part of the textarea's undo history
        pendingCharRef.current = event.key;
      }
    },
    [isFocused, isEditing, readOnly]
  );

  const onBlur = useCallback(() => {
    // Immediately save any pending changes on blur
    if (!readOnly && value !== initialValue) {
      tableMeta?.onDataUpdate?.({ rowIndex, columnId, value });
    }
    tableMeta?.onCellEditingStop?.();
  }, [tableMeta, value, initialValue, rowIndex, columnId, readOnly]);

  const onChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = event.target.value;
      setValue(newValue);
      debouncedSave(newValue);
    },
    [debouncedSave]
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
      } else if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        onSave();
      } else if (event.key === "Tab") {
        event.preventDefault();
        // Save any pending changes
        if (value !== initialValue) {
          tableMeta?.onDataUpdate?.({ rowIndex, columnId, value });
        }
        tableMeta?.onCellEditingStop?.({
          direction: event.shiftKey ? "left" : "right",
        });
        return;
      }
      // Stop propagation to prevent grid navigation
      event.stopPropagation();
    },
    [onSave, onCancel, value, initialValue, tableMeta, rowIndex, columnId]
  );

  return (
    <Popover onOpenChange={onOpenChange} open={isEditing}>
      <DataGridCellWrapper<TData>
        cell={cell}
        columnId={columnId}
        isActiveSearchMatch={isActiveSearchMatch}
        isEditing={isEditing}
        isFocused={isFocused}
        isSearchMatch={isSearchMatch}
        isSelected={isSelected}
        onKeyDown={onWrapperKeyDown}
        readOnly={readOnly}
        ref={containerRef}
        rowHeight={rowHeight}
        rowIndex={rowIndex}
        tableMeta={tableMeta}
      >
        <span data-slot="grid-cell-content">{value}</span>
      </DataGridCellWrapper>
      <PopoverContent
        align="start"
        anchor={containerRef}
        className="w-[400px] rounded-none p-0"
        data-grid-cell-editor=""
        side="bottom"
        sideOffset={sideOffset}
      >
        <Textarea
          className="max-h-[300px] min-h-[150px] resize-none overflow-y-auto rounded-none border-0 shadow-none focus-visible:ring-1 focus-visible:ring-ring"
          onBlur={onBlur}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder="Enter text..."
          ref={textareaRef}
          value={value}
        />
      </PopoverContent>
    </Popover>
  );
}

export function NumberCell<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  rowHeight,
  isFocused,
  isEditing,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  readOnly,
}: DataGridCellProps<TData>) {
  const initialValue = cell.getValue() as number;
  const [value, setValue] = useState(String(initialValue ?? ""));
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const cellOpts = cell.column.columnDef.meta?.cell;
  const numberCellOpts = cellOpts?.variant === "number" ? cellOpts : null;
  const min = numberCellOpts?.min;
  const max = numberCellOpts?.max;
  const step = numberCellOpts?.step;

  const prevIsEditingRef = useRef(isEditing);

  const prevInitialValueRef = useRef(initialValue);
  if (initialValue !== prevInitialValueRef.current) {
    prevInitialValueRef.current = initialValue;
    setValue(String(initialValue ?? ""));
  }

  const onBlur = useCallback(() => {
    const numValue = value === "" ? null : Number(value);
    if (!readOnly && numValue !== initialValue) {
      tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: numValue });
    }
    tableMeta?.onCellEditingStop?.();
  }, [tableMeta, rowIndex, columnId, initialValue, value, readOnly]);

  const onChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
  }, []);

  const onWrapperKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      handleNumberCellKeyDown({
        event,
        isEditing,
        isFocused,
        value,
        initialValue,
        tableMeta,
        rowIndex,
        columnId,
        readOnly,
        onSetValue: setValue,
        inputRef,
      });
    },
    [
      isEditing,
      isFocused,
      initialValue,
      tableMeta,
      rowIndex,
      columnId,
      value,
      readOnly,
    ]
  );

  useEffect(() => {
    const wasEditing = prevIsEditingRef.current;
    prevIsEditingRef.current = isEditing;

    // Only focus when we start editing (transition from false to true)
    if (isEditing && !wasEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  return (
    <DataGridCellWrapper<TData>
      cell={cell}
      columnId={columnId}
      isActiveSearchMatch={isActiveSearchMatch}
      isEditing={isEditing}
      isFocused={isFocused}
      isSearchMatch={isSearchMatch}
      isSelected={isSelected}
      onKeyDown={onWrapperKeyDown}
      readOnly={readOnly}
      ref={containerRef}
      rowHeight={rowHeight}
      rowIndex={rowIndex}
      tableMeta={tableMeta}
    >
      {isEditing ? (
        <input
          className="w-full border-none bg-transparent p-0 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          max={max}
          min={min}
          onBlur={onBlur}
          onChange={onChange}
          ref={inputRef}
          step={step}
          type="number"
          value={value}
        />
      ) : (
        <span data-slot="grid-cell-content">{value}</span>
      )}
    </DataGridCellWrapper>
  );
}

export function UrlCell<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  rowHeight,
  isEditing,
  isFocused,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  readOnly,
}: DataGridCellProps<TData>) {
  const initialValue = cell.getValue() as string;
  const [value, setValue] = useState(initialValue ?? "");
  const cellRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const prevInitialValueRef = useRef(initialValue);
  if (initialValue !== prevInitialValueRef.current) {
    prevInitialValueRef.current = initialValue;
    setValue(initialValue ?? "");
    if (cellRef.current && !isEditing) {
      cellRef.current.textContent = initialValue ?? "";
    }
  }

  const onBlur = useCallback(() => {
    const currentValue = cellRef.current?.textContent?.trim() ?? "";

    if (!readOnly && currentValue !== initialValue) {
      tableMeta?.onDataUpdate?.({
        rowIndex,
        columnId,
        value: currentValue || null,
      });
    }
    tableMeta?.onCellEditingStop?.();
  }, [tableMeta, rowIndex, columnId, initialValue, readOnly]);

  const onInput = useCallback((event: React.FormEvent<HTMLDivElement>) => {
    const currentValue = event.currentTarget.textContent ?? "";
    setValue(currentValue);
  }, []);

  const onWrapperKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      handleUrlCellKeyDown({
        event,
        isEditing,
        isFocused,
        initialValue: initialValue ?? "",
        tableMeta,
        rowIndex,
        columnId,
        readOnly,
        onSetValue: setValue,
        cellRef,
      });
    },
    [
      isEditing,
      isFocused,
      initialValue,
      tableMeta,
      rowIndex,
      columnId,
      readOnly,
    ]
  );

  const onLinkClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (isEditing) {
        event.preventDefault();
        return;
      }

      // Check if URL was rejected due to dangerous protocol
      const href = getUrlHref(value);
      if (!href) {
        event.preventDefault();
        toast.error("Invalid URL", {
          description:
            "URL contains a dangerous protocol (javascript:, data:, vbscript:, or file:)",
        });
        return;
      }

      // Stop propagation to prevent grid from interfering with link navigation
      event.stopPropagation();
    },
    [isEditing, value]
  );

  useEffect(() => {
    if (isEditing && cellRef.current) {
      cellRef.current.focus();

      if (!cellRef.current.textContent && value) {
        cellRef.current.textContent = value;
      }

      if (cellRef.current.textContent) {
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(cellRef.current);
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }
  }, [isEditing, value]);

  const displayValue = isEditing ? "" : (value ?? "");
  const urlHref = displayValue ? getUrlHref(displayValue) : "";
  const isDangerousUrl = displayValue && !urlHref;

  return (
    <DataGridCellWrapper<TData>
      cell={cell}
      columnId={columnId}
      isActiveSearchMatch={isActiveSearchMatch}
      isEditing={isEditing}
      isFocused={isFocused}
      isSearchMatch={isSearchMatch}
      isSelected={isSelected}
      onKeyDown={onWrapperKeyDown}
      readOnly={readOnly}
      ref={containerRef}
      rowHeight={rowHeight}
      rowIndex={rowIndex}
      tableMeta={tableMeta}
    >
      {!isEditing && displayValue ? (
        <div
          className="size-full overflow-hidden"
          data-slot="grid-cell-content"
        >
          <a
            className="truncate text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary/60 data-invalid:cursor-not-allowed data-focused:text-foreground data-invalid:text-destructive data-focused:decoration-foreground/50 data-invalid:decoration-destructive/50 data-focused:hover:decoration-foreground/70 data-invalid:hover:decoration-destructive/70"
            data-focused={isFocused && !isDangerousUrl ? "" : undefined}
            data-invalid={isDangerousUrl ? "" : undefined}
            href={urlHref}
            onClick={onLinkClick}
            rel="noopener noreferrer"
            target="_blank"
          >
            {displayValue}
          </a>
        </div>
      ) : (
        <>
          {/* biome-ignore lint/a11y/useSemanticElements: Editable content uses contentEditable and cannot be replaced by a semantic input while preserving virtualization layout. */}
          <div
            aria-multiline="false"
            className={cn("size-full overflow-hidden outline-none", {
              "whitespace-nowrap **:inline **:whitespace-nowrap [&_br]:hidden":
                isEditing,
            })}
            contentEditable={isEditing}
            data-slot="grid-cell-content"
            onBlur={onBlur}
            onInput={onInput}
            ref={cellRef}
            role="textbox"
            suppressContentEditableWarning
            tabIndex={-1}
          >
            {displayValue}
          </div>
        </>
      )}
    </DataGridCellWrapper>
  );
}

export function CheckboxCell<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  rowHeight,
  isFocused,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  readOnly,
}: Omit<DataGridCellProps<TData>, "isEditing">) {
  const initialValue = cell.getValue() as boolean;
  const [value, setValue] = useState(Boolean(initialValue));
  const containerRef = useRef<HTMLDivElement>(null);

  const prevInitialValueRef = useRef(initialValue);
  if (initialValue !== prevInitialValueRef.current) {
    prevInitialValueRef.current = initialValue;
    setValue(Boolean(initialValue));
  }

  const onCheckedChange = useCallback(
    (checked: boolean) => {
      if (readOnly) {
        return;
      }
      setValue(checked);
      tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: checked });
    },
    [tableMeta, rowIndex, columnId, readOnly]
  );

  const onWrapperKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (
        isFocused &&
        !readOnly &&
        (event.key === " " || event.key === "Enter")
      ) {
        event.preventDefault();
        event.stopPropagation();
        onCheckedChange(!value);
      } else if (isFocused && event.key === "Tab") {
        event.preventDefault();
        tableMeta?.onCellEditingStop?.({
          direction: event.shiftKey ? "left" : "right",
        });
      }
    },
    [isFocused, value, onCheckedChange, tableMeta, readOnly]
  );

  const onWrapperClick = useCallback(
    (event: React.MouseEvent) => {
      if (isFocused && !readOnly) {
        event.preventDefault();
        event.stopPropagation();
        onCheckedChange(!value);
      }
    },
    [isFocused, value, onCheckedChange, readOnly]
  );

  const onCheckboxClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
  }, []);

  const onCheckboxMouseDown = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
  }, []);

  const onCheckboxDoubleClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
  }, []);

  return (
    <DataGridCellWrapper<TData>
      cell={cell}
      className="flex size-full justify-center"
      columnId={columnId}
      isActiveSearchMatch={isActiveSearchMatch}
      isEditing={false}
      isFocused={isFocused}
      isSearchMatch={isSearchMatch}
      isSelected={isSelected}
      onClick={onWrapperClick}
      onKeyDown={onWrapperKeyDown}
      readOnly={readOnly}
      ref={containerRef}
      rowHeight={rowHeight}
      rowIndex={rowIndex}
      tableMeta={tableMeta}
    >
      <Checkbox
        checked={value}
        className="border-primary"
        disabled={readOnly}
        onCheckedChange={onCheckedChange}
        onClick={onCheckboxClick}
        onDoubleClick={onCheckboxDoubleClick}
        onMouseDown={onCheckboxMouseDown}
      />
    </DataGridCellWrapper>
  );
}

export function SelectCell<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  rowHeight,
  isFocused,
  isEditing,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  readOnly,
}: DataGridCellProps<TData>) {
  const initialValue = cell.getValue() as string;
  const [value, setValue] = useState(initialValue);
  const containerRef = useRef<HTMLDivElement>(null);
  const cellOpts = cell.column.columnDef.meta?.cell;
  const options = useMemo(
    () => (cellOpts?.variant === "select" ? cellOpts.options : []),
    [cellOpts]
  );
  const optionByValue = useMemo(
    () => new Map(options.map((option) => [option.value, option])),
    [options]
  );

  const prevInitialValueRef = useRef(initialValue);
  if (initialValue !== prevInitialValueRef.current) {
    prevInitialValueRef.current = initialValue;
    setValue(initialValue);
  }

  const onValueChange = useCallback(
    (newValue: string | null) => {
      if (readOnly || newValue === null) {
        return;
      }
      setValue(newValue);
      tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: newValue });
      tableMeta?.onCellEditingStop?.();
    },
    [tableMeta, rowIndex, columnId, readOnly]
  );

  const onOpenChange = useCallback(
    (open: boolean) => {
      if (open && !readOnly) {
        tableMeta?.onCellEditingStart?.(rowIndex, columnId);
      } else {
        tableMeta?.onCellEditingStop?.();
      }
    },
    [tableMeta, rowIndex, columnId, readOnly]
  );

  const onWrapperKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (isEditing && event.key === "Escape") {
        event.preventDefault();
        setValue(initialValue);
        tableMeta?.onCellEditingStop?.();
      } else if (isFocused && event.key === "Tab") {
        event.preventDefault();
        tableMeta?.onCellEditingStop?.({
          direction: event.shiftKey ? "left" : "right",
        });
      }
    },
    [isEditing, isFocused, initialValue, tableMeta]
  );

  const displayLabel = optionByValue.get(value)?.label ?? value;

  return (
    <DataGridCellWrapper<TData>
      cell={cell}
      columnId={columnId}
      isActiveSearchMatch={isActiveSearchMatch}
      isEditing={isEditing}
      isFocused={isFocused}
      isSearchMatch={isSearchMatch}
      isSelected={isSelected}
      onKeyDown={onWrapperKeyDown}
      readOnly={readOnly}
      ref={containerRef}
      rowHeight={rowHeight}
      rowIndex={rowIndex}
      tableMeta={tableMeta}
    >
      {isEditing ? (
        <Select
          onOpenChange={onOpenChange}
          onValueChange={onValueChange}
          open={isEditing}
          value={value}
        >
          <SelectTrigger
            className="size-full items-start border-none p-0 shadow-none focus-visible:ring-0 dark:bg-transparent [&_svg]:hidden"
            size="sm"
          >
            {displayLabel ? (
              <Badge
                className="whitespace-pre-wrap px-1.5 py-px"
                variant="secondary"
              >
                <SelectValue />
              </Badge>
            ) : (
              <SelectValue />
            )}
          </SelectTrigger>
          <SelectContent
            align="start"
            // compensate for the wrapper padding
            alignOffset={-8}
            className="min-w-[calc(var(--radix-select-trigger-width)+16px)]"
            data-grid-cell-editor=""
            sideOffset={-8}
          >
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        displayLabel && (
          <Badge
            className="whitespace-pre-wrap px-1.5 py-px"
            data-slot="grid-cell-content"
            variant="secondary"
          >
            {displayLabel}
          </Badge>
        )
      )}
    </DataGridCellWrapper>
  );
}

export function MultiSelectCell<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  rowHeight,
  isFocused,
  isEditing,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  readOnly,
}: DataGridCellProps<TData>) {
  const cellValue = useMemo(() => {
    const value = cell.getValue() as string[];
    return value ?? [];
  }, [cell]);

  const cellKey = getCellKey(rowIndex, columnId);
  const prevCellKeyRef = useRef(cellKey);

  const [selectedValues, setSelectedValues] = useState<string[]>(cellValue);
  const [searchValue, setSearchValue] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cellOpts = cell.column.columnDef.meta?.cell;
  const options = useMemo(
    () => (cellOpts?.variant === "multi-select" ? cellOpts.options : []),
    [cellOpts]
  );
  const optionByValue = useMemo(
    () => new Map(options.map((option) => [option.value, option])),
    [options]
  );
  const sideOffset = -(containerRef.current?.clientHeight ?? 0);

  const prevCellValueRef = useRef(cellValue);
  if (cellValue !== prevCellValueRef.current) {
    prevCellValueRef.current = cellValue;
    setSelectedValues(cellValue);
  }

  if (prevCellKeyRef.current !== cellKey) {
    prevCellKeyRef.current = cellKey;
    setSearchValue("");
  }

  const onValueChange = useCallback(
    (value: string) => {
      if (readOnly) {
        return;
      }
      let newValues: string[] = [];
      setSelectedValues((curr) => {
        newValues = curr.includes(value)
          ? curr.filter((v) => v !== value)
          : [...curr, value];
        return newValues;
      });
      queueMicrotask(() => {
        tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: newValues });
        inputRef.current?.focus();
      });
      setSearchValue("");
    },
    [tableMeta, rowIndex, columnId, readOnly]
  );

  const removeValue = useCallback(
    (valueToRemove: string, event?: React.MouseEvent) => {
      if (readOnly) {
        return;
      }
      event?.stopPropagation();
      event?.preventDefault();
      let newValues: string[] = [];
      setSelectedValues((curr) => {
        newValues = curr.filter((v) => v !== valueToRemove);
        return newValues;
      });
      queueMicrotask(() => {
        tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: newValues });
        inputRef.current?.focus();
      });
    },
    [tableMeta, rowIndex, columnId, readOnly]
  );

  const clearAll = useCallback(() => {
    if (readOnly) {
      return;
    }
    setSelectedValues([]);
    tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: [] });
    queueMicrotask(() => inputRef.current?.focus());
  }, [tableMeta, rowIndex, columnId, readOnly]);

  const onOpenChange = useCallback(
    (open: boolean) => {
      if (open && !readOnly) {
        tableMeta?.onCellEditingStart?.(rowIndex, columnId);
      } else {
        setSearchValue("");
        tableMeta?.onCellEditingStop?.();
      }
    },
    [tableMeta, rowIndex, columnId, readOnly]
  );

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  const onWrapperKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (isEditing && event.key === "Escape") {
        event.preventDefault();
        setSelectedValues(cellValue);
        setSearchValue("");
        tableMeta?.onCellEditingStop?.();
      } else if (isFocused && event.key === "Tab") {
        event.preventDefault();
        setSearchValue("");
        tableMeta?.onCellEditingStop?.({
          direction: event.shiftKey ? "left" : "right",
        });
      }
    },
    [isEditing, isFocused, cellValue, tableMeta]
  );

  const onInputKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Backspace" && searchValue === "") {
        event.preventDefault();
        let newValues: string[] | null = null;
        setSelectedValues((curr) => {
          if (curr.length === 0) {
            return curr;
          }
          newValues = curr.slice(0, -1);
          return newValues;
        });
        queueMicrotask(() => {
          if (newValues !== null) {
            tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: newValues });
          }
          inputRef.current?.focus();
        });
      }
      if (event.key === "Escape") {
        event.stopPropagation();
      }
    },
    [searchValue, tableMeta, rowIndex, columnId]
  );

  const displayLabels = selectedValues
    .map((val) => optionByValue.get(val)?.label ?? val)
    .filter(Boolean);

  const selectedValuesSet = useMemo(
    () => new Set(selectedValues),
    [selectedValues]
  );

  const lineCount = getLineCount(rowHeight);

  const { visibleItems: visibleLabels, hiddenCount: hiddenBadgeCount } =
    useBadgeOverflow({
      items: displayLabels,
      getLabel: (label) => label,
      containerRef,
      lineCount,
    });

  return (
    <DataGridCellWrapper<TData>
      cell={cell}
      columnId={columnId}
      isActiveSearchMatch={isActiveSearchMatch}
      isEditing={isEditing}
      isFocused={isFocused}
      isSearchMatch={isSearchMatch}
      isSelected={isSelected}
      onKeyDown={onWrapperKeyDown}
      readOnly={readOnly}
      ref={containerRef}
      rowHeight={rowHeight}
      rowIndex={rowIndex}
      tableMeta={tableMeta}
    >
      {isEditing ? (
        <Popover onOpenChange={onOpenChange} open={isEditing}>
          <PopoverContent
            align="start"
            anchor={containerRef}
            className="w-[300px] rounded-none p-0"
            data-grid-cell-editor=""
            sideOffset={sideOffset}
          >
            <Command className="**:data-[slot=command-input-wrapper]:h-auto **:data-[slot=command-input-wrapper]:border-none **:data-[slot=command-input-wrapper]:p-0 [&_[data-slot=command-input-wrapper]_svg]:hidden">
              <div className="flex min-h-9 flex-wrap items-center gap-1 border-b px-3 py-1.5">
                {selectedValues.map((value) => {
                  const label = optionByValue.get(value)?.label ?? value;

                  return (
                    <Badge
                      className="gap-1 px-1.5 py-px"
                      key={value}
                      variant="secondary"
                    >
                      {label}
                      <button
                        onClick={(event) => removeValue(value, event)}
                        onPointerDown={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                        }}
                        type="button"
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  );
                })}
                <CommandInput
                  className="h-auto flex-1 p-0"
                  onKeyDown={onInputKeyDown}
                  onValueChange={setSearchValue}
                  placeholder="Search..."
                  ref={inputRef}
                  value={searchValue}
                />
              </div>
              <CommandList className="max-h-full">
                <CommandEmpty>No options found.</CommandEmpty>
                <CommandGroup className="max-h-[300px] scroll-py-1 overflow-y-auto overflow-x-hidden">
                  {options.map((option) => {
                    const isSelected = selectedValuesSet.has(option.value);

                    return (
                      <CommandItem
                        key={option.value}
                        onSelect={() => onValueChange(option.value)}
                        value={option.label}
                      >
                        <div
                          className={cn(
                            "flex size-4 items-center justify-center rounded-sm border border-primary",
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "opacity-50 [&_svg]:invisible"
                          )}
                        >
                          <Check className="size-3" />
                        </div>
                        <span>{option.label}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                {selectedValues.length > 0 && (
                  <>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem
                        className="justify-center text-muted-foreground"
                        onSelect={clearAll}
                      >
                        Clear all
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      ) : null}
      {displayLabels.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1 overflow-hidden">
          {visibleLabels.map((label, index) => (
            <Badge
              className="px-1.5 py-px"
              key={selectedValues[index]}
              variant="secondary"
            >
              {label}
            </Badge>
          ))}
          {hiddenBadgeCount > 0 && (
            <Badge
              className="px-1.5 py-px text-muted-foreground"
              variant="outline"
            >
              +{hiddenBadgeCount}
            </Badge>
          )}
        </div>
      ) : null}
    </DataGridCellWrapper>
  );
}

export function DateCell<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  rowHeight,
  isFocused,
  isEditing,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  readOnly,
}: DataGridCellProps<TData>) {
  const initialValue = cell.getValue() as string;
  const [value, setValue] = useState(initialValue ?? "");
  const containerRef = useRef<HTMLDivElement>(null);

  const prevInitialValueRef = useRef(initialValue);
  if (initialValue !== prevInitialValueRef.current) {
    prevInitialValueRef.current = initialValue;
    setValue(initialValue ?? "");
  }

  // Parse date as local time to avoid timezone shifts
  const selectedDate = value ? (parseLocalDate(value) ?? undefined) : undefined;

  const onDateSelect = useCallback(
    (date: Date | undefined) => {
      if (!date || readOnly) {
        return;
      }

      // Format using local date components to avoid timezone issues
      const formattedDate = formatDateToString(date);
      setValue(formattedDate);
      tableMeta?.onDataUpdate?.({ rowIndex, columnId, value: formattedDate });
      tableMeta?.onCellEditingStop?.();
    },
    [tableMeta, rowIndex, columnId, readOnly]
  );

  const onOpenChange = useCallback(
    (open: boolean) => {
      if (open && !readOnly) {
        tableMeta?.onCellEditingStart?.(rowIndex, columnId);
      } else {
        tableMeta?.onCellEditingStop?.();
      }
    },
    [tableMeta, rowIndex, columnId, readOnly]
  );

  const onWrapperKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (isEditing && event.key === "Escape") {
        event.preventDefault();
        setValue(initialValue);
        tableMeta?.onCellEditingStop?.();
      } else if (isFocused && event.key === "Tab") {
        event.preventDefault();
        tableMeta?.onCellEditingStop?.({
          direction: event.shiftKey ? "left" : "right",
        });
      }
    },
    [isEditing, isFocused, initialValue, tableMeta]
  );

  return (
    <DataGridCellWrapper<TData>
      cell={cell}
      columnId={columnId}
      isActiveSearchMatch={isActiveSearchMatch}
      isEditing={isEditing}
      isFocused={isFocused}
      isSearchMatch={isSearchMatch}
      isSelected={isSelected}
      onKeyDown={onWrapperKeyDown}
      readOnly={readOnly}
      ref={containerRef}
      rowHeight={rowHeight}
      rowIndex={rowIndex}
      tableMeta={tableMeta}
    >
      <Popover onOpenChange={onOpenChange} open={isEditing}>
        <span data-slot="grid-cell-content">{formatDateForDisplay(value)}</span>
        {isEditing && (
          <PopoverContent
            align="start"
            alignOffset={-8}
            anchor={containerRef}
            className="w-auto p-0"
            data-grid-cell-editor=""
          >
            <Calendar
              autoFocus
              captionLayout="dropdown"
              defaultMonth={selectedDate ?? new Date()}
              mode="single"
              onSelect={onDateSelect}
              selected={selectedDate}
            />
          </PopoverContent>
        )}
      </Popover>
    </DataGridCellWrapper>
  );
}

export function FileCell<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  rowHeight,
  isFocused,
  isEditing,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  readOnly,
}: DataGridCellProps<TData>) {
  const cellValue = useMemo(
    () => (cell.getValue() as FileCellData[]) ?? [],
    [cell]
  );

  const cellKey = getCellKey(rowIndex, columnId);
  const prevCellKeyRef = useRef(cellKey);

  const labelId = useId();
  const descriptionId = useId();

  const [files, setFiles] = useState<FileCellData[]>(cellValue);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const [deletingFiles, setDeletingFiles] = useState<Set<string>>(new Set());
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isUploading = uploadingFiles.size > 0;
  const isDeleting = deletingFiles.size > 0;
  const isPending = isUploading || isDeleting;
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const cellOpts = cell.column.columnDef.meta?.cell;
  const sideOffset = -(containerRef.current?.clientHeight ?? 0);

  const fileCellOpts = cellOpts?.variant === "file" ? cellOpts : null;
  const maxFileSize = fileCellOpts?.maxFileSize ?? 10 * 1024 * 1024;
  const maxFiles = fileCellOpts?.maxFiles ?? 10;
  const accept = fileCellOpts?.accept;
  const multiple = fileCellOpts?.multiple ?? false;

  const acceptedTypes = useMemo(
    () => (accept ? accept.split(",").map((t) => t.trim()) : null),
    [accept]
  );

  const prevCellValueRef = useRef(cellValue);
  syncFileCellState({
    cellValue,
    files,
    cellKey,
    prevCellValueRef,
    prevCellKeyRef,
    setFiles,
    setError,
  });

  const validateFile = useCallback(
    (file: File): string | null => {
      return getFileValidationResult({
        file,
        maxFileSize,
        acceptedTypes,
      });
    },
    [maxFileSize, acceptedTypes]
  );

  const showFileUploadError = useCallback(
    (message: string, description?: string) => {
      setError(message);
      if (description) {
        toast(message, { description });
      } else {
        toast(message);
      }

      setTimeout(() => {
        setError(null);
      }, FILE_ERROR_RESET_DELAY_MS);
    },
    []
  );

  const addFiles = useCallback(
    async (newFiles: File[], skipUpload = false) => {
      await handleAddFiles({
        newFiles,
        skipUpload,
        files,
        maxFiles,
        readOnly,
        isPending,
        validateFile,
        showFileUploadError,
        tableMeta,
        rowIndex,
        columnId,
        setError,
        setFiles,
        setUploadingFiles,
      });
    },
    [
      files,
      maxFiles,
      validateFile,
      showFileUploadError,
      tableMeta,
      rowIndex,
      columnId,
      readOnly,
      isPending,
    ]
  );

  const removeFile = useCallback(
    async (fileId: string) => {
      await handleRemoveFile({
        fileId,
        readOnly,
        isPending,
        files,
        tableMeta,
        rowIndex,
        columnId,
        setError,
        setDeletingFiles,
        setFiles,
      });
    },
    [files, tableMeta, rowIndex, columnId, readOnly, isPending]
  );

  const clearAll = useCallback(async () => {
    await handleClearAllFiles({
      readOnly,
      isPending,
      files,
      tableMeta,
      rowIndex,
      columnId,
      setError,
      setDeletingFiles,
      setFiles,
    });
  }, [files, tableMeta, rowIndex, columnId, readOnly, isPending]);

  const onCellDragEnter = useCallback((event: React.DragEvent) => {
    handleDropzoneCellEnter({
      event,
      setIsDragging: setIsDraggingOver,
      allowFilesOnly: true,
    });
  }, []);

  const onCellDragLeave = useCallback((event: React.DragEvent) => {
    updateDragStateOnLeave({
      event,
      isDraggingStateSetter: setIsDraggingOver,
    });
  }, []);

  const onCellDragOver = useCallback((event: React.DragEvent) => {
    handleFileDragOver(event);
  }, []);

  const onCellDrop = useCallback(
    (event: React.DragEvent) => {
      handleFileDropToCell({
        event,
        addFiles,
        setIsDraggingOver,
      });
    },
    [addFiles]
  );

  const onDropzoneDragEnter = useCallback((event: React.DragEvent) => {
    handleDropzoneCellEnter({
      event,
      setIsDragging,
    });
  }, []);

  const onDropzoneDragLeave = useCallback((event: React.DragEvent) => {
    updateDragStateOnLeave({
      event,
      isDraggingStateSetter: setIsDragging,
    });
  }, []);

  const onDropzoneDragOver = useCallback((event: React.DragEvent) => {
    handleFileDragOver(event);
  }, []);

  const onDropzoneDrop = useCallback(
    (event: React.DragEvent) => {
      handleDropzoneFileDrop({
        event,
        addFiles,
        setIsDragging,
      });
    },
    [addFiles]
  );

  const onDropzoneClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const stopNavigation = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      stopFileCellNavigation({
        event,
        tableMeta,
      });
    },
    [tableMeta]
  );

  const onDropzoneKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      handleDropzoneKeyDown({
        event,
        onDropzoneClick,
      });
    },
    [onDropzoneClick]
  );

  const onFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(event.target.files ?? []);
      addFiles(selectedFiles, false);
      event.target.value = "";
    },
    [addFiles]
  );

  const onOpenChange = useCallback(
    (open: boolean) => {
      handleDropzoneCellOpen({
        open,
        readOnly,
        rowIndex,
        columnId,
        tableMeta,
        setError,
      });
    },
    [tableMeta, rowIndex, columnId, readOnly]
  );

  useEffect(() => {
    focusDropzoneOnOpen(isEditing, dropzoneRef);
  }, [isEditing]);

  const onWrapperKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      handleFileWrapperKeyDown({
        event,
        isEditing,
        isFocused,
        cellValue,
        tableMeta,
        rowIndex,
        columnId,
        stopNavigation,
        onDropzoneClick,
        setFiles,
        setError,
      });
    },
    [
      isEditing,
      isFocused,
      cellValue,
      stopNavigation,
      tableMeta,
      onDropzoneClick,
      rowIndex,
      columnId,
    ]
  );

  useEffect(() => {
    return () => {
      revokeTrackedFiles(files);
    };
  }, [files]);

  const lineCount = getLineCount(rowHeight);

  const { visibleItems: visibleFiles, hiddenCount: hiddenFileCount } =
    useBadgeOverflow({
      items: files,
      getLabel: (file) => file.name,
      containerRef,
      lineCount,
      cacheKeyPrefix: "file",
      iconSize: 12,
      maxWidth: 100,
    });

  return (
    <DataGridCellWrapper<TData>
      cell={cell}
      className={cn({
        "ring-1 ring-primary/80 ring-inset": isDraggingOver,
      })}
      columnId={columnId}
      isActiveSearchMatch={isActiveSearchMatch}
      isEditing={isEditing}
      isFocused={isFocused}
      isSearchMatch={isSearchMatch}
      isSelected={isSelected}
      onDragEnter={onCellDragEnter}
      onDragLeave={onCellDragLeave}
      onDragOver={onCellDragOver}
      onDrop={onCellDrop}
      onKeyDown={onWrapperKeyDown}
      readOnly={readOnly}
      ref={containerRef}
      rowHeight={rowHeight}
      rowIndex={rowIndex}
      tableMeta={tableMeta}
    >
      {renderFileCellPopover({
        isEditing,
        onOpenChange,
        containerRef,
        sideOffset,
        labelId,
        descriptionId,
        onDropzoneClick,
        onDropzoneDragEnter,
        onDropzoneDragLeave,
        onDropzoneDragOver,
        onDropzoneDrop,
        onDropzoneKeyDown,
        dropzoneRef,
        isPending,
        isDragging,
        error,
        accept,
        multiple,
        onFileInputChange,
        fileInputRef,
        files,
        clearAll,
        removeFile,
        uploadingFiles,
        deletingFiles,
        maxFileSize,
        maxFiles,
      })}
      {renderFileCellSummary({
        isDraggingOver,
        files,
        visibleFiles,
        hiddenFileCount,
        uploadingFiles,
      })}
    </DataGridCellWrapper>
  );
}
