import * as React from "react";

function subscribe() {
  return () => {
    /* static store — no subscription needed */
  };
}

function getSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

function useMounted() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export { useMounted };
