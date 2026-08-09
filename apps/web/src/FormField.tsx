import type { ReactNode } from "react";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: "block", marginBottom: 12 }}>
      <span className="dfp-label">{label}</span>
      {children}
    </label>
  );
}
