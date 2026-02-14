"use client";

import { useState } from "react";

export default function CitationsDrawer({ citations = [] }) {
  const [open, setOpen] = useState(false);
  if (!citations.length) return null;

  return (
    <div className="citations">
      <button className="text-button" onClick={() => setOpen((value) => !value)}>
        {open ? "Hide sources" : `View sources (${citations.length})`}
      </button>
      {open ? (
        <ul>
          {citations.map((source) => (
            <li key={source.id}>
              <a href={source.url} target="_blank" rel="noreferrer">
                {source.title}
              </a>
              <span className="muted">
                {" "}
                ({source.docType}, updated {source.updatedAt})
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
