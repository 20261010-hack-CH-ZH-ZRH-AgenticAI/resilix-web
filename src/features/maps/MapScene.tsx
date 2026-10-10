"use client";
import { SituationMap } from "@resilix/ui-canvas";
import { useMapWorkspace } from "./MapWorkspaceProvider";
import { useMapMessages } from "./messages";
import { readCoordinates } from "./route-api";
export function MapScene({
  selected,
  onSelect,
}: {
  selected?: string;
  onSelect?: (id: string) => void;
}) {
  const map = useMapWorkspace();
  const { messages, labels } = useMapMessages();
  let destination: { latitude: number; longitude: number } | undefined;
  try {
    destination = readCoordinates(map.destinationFields);
  } catch {
    /* Incomplete user input has no map marker. */
  }
  const markers = [
    ...map.markers,
    ...(destination
      ? [
          {
            id: "route-destination",
            title: messages.selectedDestination,
            visibility: "personal",
            ...destination,
          },
        ]
      : []),
  ];
  return (
    <SituationMap
      markers={markers}
      selected={selected ?? (destination ? "route-destination" : undefined)}
      onSelect={
        onSelect ??
        ((id) => {
          const marker = map.markers.find((item) => item.id === id);
          if (
            typeof marker?.latitude === "number" &&
            typeof marker.longitude === "number"
          )
            map.setDestination({
              latitude: marker.latitude,
              longitude: marker.longitude,
            });
        })
      }
      tileUrl={map.config.mapTileUrl}
      attribution={map.config.mapAttribution}
      attributionUrl={map.config.mapAttributionUrl}
      route={map.route}
      position={map.position}
      onPickDestination={map.picking ? map.setDestination : undefined}
      labels={labels}
    />
  );
}
