"use client";

import CitationsDrawer from "./CitationsDrawer";
import ProductCard from "./ProductCard";

export default function MessageList({
  messages,
  modelNumber,
  onCardAction,
  onQuickAction,
  quickActionsDisabled
}) {
  return (
    <div className="message-list" data-testid="message-list">
      {messages.map((message) => (
        <div key={message.id} className={`message-row ${message.role}`} data-testid={`message-${message.role}`}>
          <div className={`bubble ${message.role}`}>
            <p>{message.content}</p>

            {message.checklist?.length ? (
              <ol className="checklist">
                {message.checklist.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            ) : null}

            {message.parts?.length ? (
              <div className="parts-grid">
                {message.parts.map((part) => (
                  <ProductCard
                    key={part.psNumber}
                    part={part}
                    modelNumber={modelNumber}
                    onAction={onCardAction}
                  />
                ))}
              </div>
            ) : null}

            {message.nextActions?.length ? (
              <div className="chips">
                {message.nextActions.map((action) => (
                  <button
                    key={action}
                    type="button"
                    className="chip"
                    onClick={() => onQuickAction?.(action)}
                    disabled={quickActionsDisabled}
                  >
                    {action}
                  </button>
                ))}
              </div>
            ) : null}

            <CitationsDrawer citations={message.citations} />
          </div>
        </div>
      ))}
    </div>
  );
}
