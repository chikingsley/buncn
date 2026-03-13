"use client";

import type { Row } from "@tanstack/react-table";
import { Loader, Trash } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import type { Task } from "@/db/schema";
import { useMediaQuery } from "@/hooks/use-media-query";

import { deleteTasks } from "../lib/actions";

interface DeleteTasksDialogProps {
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
  open?: boolean;
  showTrigger?: boolean;
  tasks: Row<Task>["original"][];
}

export function DeleteTasksDialog({
  tasks,
  showTrigger = true,
  onSuccess,
  open,
  onOpenChange,
}: DeleteTasksDialogProps) {
  const [isDeletePending, startDeleteTransition] = useTransition();
  const isDesktop = useMediaQuery("(min-width: 640px)");

  function onDelete() {
    startDeleteTransition(async () => {
      const { error } = await deleteTasks({
        ids: tasks.map((task) => task.id),
      });

      if (error) {
        toast.error(error);
        return;
      }

      onOpenChange?.(false);
      toast.success("Tasks deleted");
      onSuccess?.();
    });
  }

  if (isDesktop) {
    return (
      <Dialog
        onOpenChange={(_open, _details) => onOpenChange?.(_open)}
        open={open}
      >
        {showTrigger ? (
          <DialogTrigger render={<Button size="sm" variant="outline" />}>
            <Trash aria-hidden="true" className="mr-2 size-4" />
            Delete ({tasks.length})
          </DialogTrigger>
        ) : null}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your{" "}
              <span className="font-medium">{tasks.length}</span>
              {tasks.length === 1 ? " task" : " tasks"} from our servers.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:space-x-0">
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              aria-label="Delete selected rows"
              disabled={isDeletePending}
              onClick={onDelete}
              variant="destructive"
            >
              {isDeletePending && (
                <Loader
                  aria-hidden="true"
                  className="mr-2 size-4 animate-spin"
                />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer onOpenChange={onOpenChange} open={open}>
      {showTrigger ? (
        <DrawerTrigger render={<Button size="sm" variant="outline" />}>
          <Trash aria-hidden="true" className="mr-2 size-4" />
          Delete ({tasks.length})
        </DrawerTrigger>
      ) : null}
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Are you absolutely sure?</DrawerTitle>
          <DrawerDescription>
            This action cannot be undone. This will permanently delete your{" "}
            <span className="font-medium">{tasks.length}</span>
            {tasks.length === 1 ? " task" : " tasks"} from our servers.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter className="gap-2 sm:space-x-0">
          <DrawerClose render={<Button variant="outline" />}>
            Cancel
          </DrawerClose>
          <Button
            aria-label="Delete selected rows"
            disabled={isDeletePending}
            onClick={onDelete}
            variant="destructive"
          >
            {isDeletePending && (
              <Loader aria-hidden="true" className="mr-2 size-4 animate-spin" />
            )}
            Delete
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
