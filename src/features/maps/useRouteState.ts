"use client";
import type { MapPosition } from "@resilix/ui-canvas";
import { useCallback, useEffect, useRef, useState } from "react";
import { type LocationFailure, requestBrowserLocation } from "./geolocation";
import type { MapMessageKey } from "./messages";
import {
  type CoordinateFields,
  calculateRoute,
  emptyCoordinates,
  MapRequestError,
  type RouteArgs,
  type RouteProfile,
  type RouteResult,
  routeErrorKey,
  routeInput,
} from "./route-api";

const fields = (value: MapPosition): CoordinateFields => ({
  latitude: String(value.latitude),
  longitude: String(value.longitude),
});
export function useRouteState() {
  const [position, setPosition] = useState<MapPosition>();
  const [originFields, setOrigin] =
    useState<CoordinateFields>(emptyCoordinates);
  const [destinationFields, setDestinationFields] =
    useState<CoordinateFields>(emptyCoordinates);
  const [profile, changeProfile] = useState<RouteProfile>("foot");
  const [route, setRoute] = useState<RouteResult>();
  const [consent, changeConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<MapMessageKey>();
  const generation = useRef(0),
    shared = useRef(false);
  useEffect(
    () => () => {
      generation.current++;
    },
    [],
  );
  const invalidate = () => {
    generation.current++;
    setRoute(undefined);
    setBusy(false);
    setLocating(false);
    setError(undefined);
  };
  const setConsent = (value: boolean) => {
    shared.current = value;
    changeConsent(value);
    if (!value) invalidate();
  };
  const setOriginFields = (value: CoordinateFields) => {
    invalidate();
    setOrigin(value);
  };
  const setDestination = (value: MapPosition) => {
    invalidate();
    setDestinationFields(fields(value));
    setPicking(false);
  };
  const setDestinationInput = (value: CoordinateFields) => {
    invalidate();
    setDestinationFields(value);
  };
  const setProfile = (value: RouteProfile) => {
    invalidate();
    changeProfile(value);
  };
  const clearRoute = () => {
    invalidate();
    setConsent(false);
    setPosition(undefined);
    setOrigin(emptyCoordinates);
    setDestinationFields(emptyCoordinates);
    setPicking(false);
    setLocating(false);
  };
  const locate = async () => {
    const current = ++generation.current;
    setLocating(true);
    setError(undefined);
    setRoute(undefined);
    setBusy(false);
    try {
      const result = await requestBrowserLocation();
      if (generation.current !== current) return;
      const value = {
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
        accuracy_m: result.coords.accuracy,
      };
      setPosition(value);
      setOrigin(fields(value));
    } catch (reason) {
      if (generation.current === current)
        setError(
          typeof reason === "string" &&
            [
              "locationUnsupported",
              "locationDenied",
              "locationUnavailable",
              "locationTimeout",
            ].includes(reason)
            ? (reason as LocationFailure)
            : "locationUnavailable",
        );
    } finally {
      if (generation.current === current) setLocating(false);
    }
  };
  const planRoute = useCallback(
    async (args: RouteArgs = {}) => {
      const current = ++generation.current;
      setBusy(true);
      setLocating(false);
      setError(undefined);
      setRoute(undefined);
      try {
        const input = routeInput(
          args,
          originFields,
          destinationFields,
          shared.current,
          profile,
        );
        const result = await calculateRoute(input);
        if (generation.current !== current || !shared.current)
          throw new MapRequestError("cancelled");
        setRoute(result);
        changeProfile(result.profile);
        setOrigin(fields(result.origin));
        setDestinationFields(fields(result.destination));
        return result;
      } catch (reason) {
        if (generation.current === current) setError(routeErrorKey(reason));
        throw reason;
      } finally {
        if (generation.current === current) setBusy(false);
      }
    },
    [originFields, destinationFields, profile],
  );
  return {
    position,
    route,
    consent,
    busy,
    locating,
    picking,
    error,
    profile,
    originFields,
    destinationFields,
    setConsent,
    setOriginFields,
    setDestinationInput,
    setDestination,
    setProfile,
    setPicking,
    clearRoute,
    locate,
    planRoute,
  };
}
