"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { AppId } from "./apps";

/**
 * The app a route opens first, rendered by the route's server component.
 * Using it for the initial window puts that app's content straight into the
 * HTML (no lazy-loading boundary), so it is readable before — or without —
 * JavaScript, and each route still ships only its own app's code.
 */
export interface InitialContent {
  app: AppId;
  params: Record<string, string>;
  node: ReactNode;
}

const Ctx = createContext<InitialContent | null>(null);

export function InitialContentProvider({ value, children }: { value: InitialContent | null; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useInitialContent(app: AppId | undefined, params: Record<string, string> | undefined): ReactNode | null {
  const initial = useContext(Ctx);
  if (!initial || !app || !params || initial.app !== app) return null;
  const a = Object.keys(initial.params);
  const b = Object.keys(params);
  if (a.length !== b.length || a.some((k) => initial.params[k] !== params[k])) return null;
  return initial.node;
}
