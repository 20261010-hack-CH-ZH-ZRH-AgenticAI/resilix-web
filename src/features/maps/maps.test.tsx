import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { PreferencesProvider } from "@/lib/i18n/Provider";
import { locationError } from "./geolocation";
import { MapWorkspaceProvider } from "./MapWorkspaceProvider";
import { mapMessages } from "./messages";
import { RoutePlanner } from "./RoutePlanner";
import {
  emptyCoordinates,
  MapRequestError,
  readCoordinates,
  routeInput,
  routeSchema,
} from "./route-api";

const start = { latitude: "47.3769", longitude: "8.5417" };
const end = { latitude: "47.3763", longitude: "8.5481" };
test("empty or invalid coordinate inputs never become a fabricated position", () => {
  expect(() => readCoordinates(emptyCoordinates)).toThrow(MapRequestError);
  expect(() => readCoordinates({ latitude: "91", longitude: "8" })).toThrow();
  expect(() => readCoordinates({ latitude: "NaN", longitude: "8" })).toThrow();
  expect(readCoordinates(start)).toEqual({
    latitude: 47.3769,
    longitude: 8.5417,
  });
});
test("coordinate sharing requires explicit consent even for voice-provided endpoints", () => {
  const args = {
    origin: readCoordinates(start),
    destination: readCoordinates(end),
  };
  expect(() =>
    routeInput(args, emptyCoordinates, emptyCoordinates, false, "foot"),
  ).toThrow("consentRequired");
  const input = routeInput({}, start, end, true, "foot");
  expect(input.share_with_routing_provider).toBe(true);
  expect(input.origin).toEqual(args.origin);
  expect(input.destination).toEqual(args.destination);
  expect(input.profile).toBe("foot");
});
test("route client rejects geometry-less and fabricated safety assurances", () => {
  expect(
    routeSchema.safeParse({ geometry: { type: "LineString", coordinates: [] } })
      .success,
  ).toBe(false);
  expect(
    routeSchema.shape.provenance.shape.safety_assessed.safeParse(true).success,
  ).toBe(false);
  expect(
    routeSchema.shape.geometry.safeParse({
      type: "LineString",
      coordinates: [
        [8, 47],
        [NaN, 48],
      ],
    }).success,
  ).toBe(false);
});
test("map privacy, permission and route messages are complete in four languages", () => {
  for (const messages of Object.values(mapMessages)) {
    expect(Object.keys(messages).sort()).toEqual(
      Object.keys(mapMessages.en).sort(),
    );
    for (const value of Object.values(messages))
      expect(value.trim().length).toBeGreaterThan(0);
  }
  expect(locationError({ code: 1 } as GeolocationPositionError)).toBe(
    "locationDenied",
  );
  expect(locationError({ code: 2 } as GeolocationPositionError)).toBe(
    "locationUnavailable",
  );
  expect(locationError({ code: 3 } as GeolocationPositionError)).toBe(
    "locationTimeout",
  );
});
test("rendered planner starts with blank endpoints and unchecked provider consent", () => {
  const html = renderToStaticMarkup(
    <PreferencesProvider>
      <MapWorkspaceProvider
        alerts={[]}
        personal={[]}
        config={{ mapAttribution: "swisstopo" }}
      >
        <RoutePlanner compact />
      </MapWorkspaceProvider>
    </PreferencesProvider>,
  );
  expect(html).toContain("Use my location");
  expect(html).toContain("The provider may log coordinates");
  expect(html).toContain('type="checkbox"');
  expect(html).not.toContain("checked=");
  expect(html).toContain('value=""');
  expect(html).not.toContain("47.3769");
  expect(html).not.toContain("<polyline");
});
