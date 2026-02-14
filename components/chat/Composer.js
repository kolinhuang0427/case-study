"use client";

import { useState } from "react";

export default function Composer({ onSend, disabled }) {
  const [value, setValue] = useState("");

  function submit() {
    if (!value.trim()) return;
    onSend(value);
    setValue("");
  }

  return (
    <div className="composer">
      <textarea
        rows={3}
        placeholder="Ask about parts, fit checks, install steps, troubleshooting, or order support..."
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            submit();
          }
        }}
      />
      <button onClick={submit} disabled={disabled}>
        Send
      </button>
    </div>
  );
}
