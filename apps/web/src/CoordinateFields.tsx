import { formatLatDdm, formatLonDdm, parseLatDdm, parseLonDdm, type LatLon } from "@dcs-flight-planner/core";
import { Field } from "./FormField";

export function DdmField({
  label,
  value,
  format,
  parse,
  onCommit,
}: {
  label: string;
  value: number;
  format: (v: number) => string;
  parse: (s: string) => number | null;
  onCommit: (v: number) => void;
}) {
  return (
    <Field label={label}>
      <input
        type="text"
        defaultValue={format(value)}
        key={value}
        className="dfp-input dfp-input-mono"
        onBlur={(e) => {
          const parsed = parse(e.target.value);
          if (parsed !== null) {
            onCommit(parsed);
          } else {
            e.target.value = format(value);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
      />
    </Field>
  );
}

export function CoordinateFields({ point, onChange }: { point: LatLon; onChange: (p: LatLon) => void }) {
  return (
    <>
      <DdmField label="Latitude" value={point.lat} format={formatLatDdm} parse={parseLatDdm} onCommit={(lat) => onChange({ ...point, lat })} />
      <DdmField label="Longitude" value={point.lon} format={formatLonDdm} parse={parseLonDdm} onCommit={(lon) => onChange({ ...point, lon })} />
    </>
  );
}
