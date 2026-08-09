import { PRESET_COLORS } from "./colorPresets";

export function ColorField({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const preset = PRESET_COLORS.find((p) => p.hex.toLowerCase() === value.toLowerCase());
  return (
    <div style={{ display: "flex", gap: 6 }}>
      <select
        className="dfp-select"
        value={preset ? preset.hex : "custom"}
        onChange={(e) => {
          if (e.target.value !== "custom") onChange(e.target.value);
        }}
        style={{ flex: 1 }}
      >
        <option value="custom">Custom…</option>
        {PRESET_COLORS.map((p) => (
          <option key={p.hex} value={p.hex}>
            {p.label}
          </option>
        ))}
      </select>
      <input type="color" className="dfp-color-swatch" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
