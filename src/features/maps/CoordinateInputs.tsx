import { useId } from "react";
import type { MapMessages } from "./messages";
import styles from "./RoutePlannerStyles.module.css";
import type { CoordinateFields } from "./route-api";
export function CoordinateInputs({
  label,
  value,
  onChange,
  messages,
}: {
  label: string;
  value: CoordinateFields;
  onChange: (value: CoordinateFields) => void;
  messages: MapMessages;
}) {
  const id = useId();
  return (
    <fieldset className={styles.coordinates}>
      <legend>{label}</legend>
      {(["latitude", "longitude"] as const).map((key) => (
        <label key={key} htmlFor={`${id}-${key}`}>
          <span>{messages[key]}</span>
          <input
            id={`${id}-${key}`}
            type="number"
            inputMode="decimal"
            step="any"
            min={key === "latitude" ? -85 : -180}
            max={key === "latitude" ? 85 : 180}
            value={value[key]}
            onChange={(event) =>
              onChange({ ...value, [key]: event.target.value })
            }
            autoComplete="off"
          />
        </label>
      ))}
    </fieldset>
  );
}
