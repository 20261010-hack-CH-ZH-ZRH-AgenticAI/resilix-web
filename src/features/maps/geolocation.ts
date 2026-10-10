export type LocationFailure =
  | "locationUnsupported"
  | "locationDenied"
  | "locationUnavailable"
  | "locationTimeout";
export function locationError(
  error: GeolocationPositionError,
): LocationFailure {
  if (error.code === 1) return "locationDenied";
  if (error.code === 3) return "locationTimeout";
  return "locationUnavailable";
}
export function requestBrowserLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!globalThis.navigator?.geolocation) {
      reject("locationUnsupported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      resolve,
      (error) => reject(locationError(error)),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  });
}
