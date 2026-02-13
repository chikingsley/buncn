const TASKS_CHANGED_EVENT = "tasks:changed";

export function emitTasksChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(TASKS_CHANGED_EVENT));
}

export function subscribeToTasksChanged(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener(TASKS_CHANGED_EVENT, callback);
  return () => window.removeEventListener(TASKS_CHANGED_EVENT, callback);
}
