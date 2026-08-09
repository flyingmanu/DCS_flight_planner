import { useEffect, useRef, useState } from "react";

interface SaveAsDialogProps {
  defaultName: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

export function SaveAsDialog({ defaultName, onConfirm, onCancel }: SaveAsDialogProps) {
  const [name, setName] = useState(defaultName);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  function confirm() {
    onConfirm(name.trim() || "Mission sans nom");
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
        <div style={{ fontWeight: 700, marginBottom: 12 }}>Enregistrer sous</div>
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
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
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
