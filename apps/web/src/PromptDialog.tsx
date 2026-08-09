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
  confirmLabel = "Save",
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
      className="dfp-scrim"
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 20,
      }}
    >
      <div
        className="dfp-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          borderRadius: "var(--dfp-radius-lg)",
          width: 340,
          overflow: "hidden",
        }}
      >
        <div className="dfp-panel-header">{title}</div>
        <div style={{ padding: 18 }}>
          <input
            ref={inputRef}
            type="text"
            className="dfp-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") confirm();
              if (e.key === "Escape") onCancel();
            }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
            <button type="button" className="dfp-btn" onClick={onCancel}>
              Cancel
            </button>
            <button type="button" className="dfp-btn dfp-btn-accent" onClick={confirm}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
