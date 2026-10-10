"use client";
import { createContext, type ReactNode, useContext } from "react";
import type { Alert, PublicConfig } from "@/lib/api/client";
import { useRouteState } from "./useRouteState";

type Workspace = ReturnType<typeof useRouteState> & {
  markers: Alert[];
  config: PublicConfig;
};
const Context = createContext<Workspace | null>(null);
export function MapWorkspaceProvider({
  children,
  alerts,
  personal,
  config,
}: {
  children: ReactNode;
  alerts: Alert[];
  personal: Alert[];
  config: PublicConfig;
}) {
  const state = useRouteState();
  return (
    <Context.Provider
      value={{ ...state, markers: [...alerts, ...personal], config }}
    >
      {children}
    </Context.Provider>
  );
}
export function useMapWorkspace() {
  const value = useContext(Context);
  if (!value) throw new Error("MapWorkspaceProvider required");
  return value;
}
