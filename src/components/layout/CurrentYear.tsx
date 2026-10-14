"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * The year is read on the client only, so the prerendered shell never bakes
 * in a stale value (and Cache Components never sees `new Date()` at build).
 */
export function CurrentYear() {
  const year = useSyncExternalStore(
    subscribe,
    () => new Date().getFullYear(),
    () => null,
  );
  return <span>{year}</span>;
}
