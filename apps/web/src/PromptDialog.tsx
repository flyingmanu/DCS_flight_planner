import { useEffect, useRef, useState } from "react";

interface PromptDialogProps {
  title: string;
  defaultValue: string;
  fallbackValue: string;
  confirmLabel?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export function PromptDialog({
  title,
  defaultValue,
  fallbackValue,
  confirmLabel = "Enregistrer",
  onConfirm,
  onCancel,
}: PromptDialogProps) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  function confirm() {
    onConfirm(value.trim() || fallbackValue);
  }

  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 6,
          padding: 20,
          width: 320,
          boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 12 }}>{title}</div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") confirm();
            if (e.key === "Escape") onCancel();
          }}
          style={{ width: "100%", padding: 6, boxSizing: "border-box", fontSize: 14 }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <button type="button" onClick={onCancel}>
            Annuler
          </button>
          <button type="button" onClick={confirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
