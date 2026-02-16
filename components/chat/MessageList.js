"use client";

import { useEffect, useRef, useState } from "react";
import CitationsDrawer from "./CitationsDrawer";
import ProductCard from "./ProductCard";

function isInScopeAction(action) {
  const applianceType = action?.payload?.applianceType;
  if (!applianceType) return true;
  return applianceType === "refrigerator" || applianceType === "dishwasher";
}

function sanitizeActions(actions = []) {
  const safeActions = actions.filter((action) => action?.enabled !== false && isInScopeAction(action)).slice(0, 3);
  let primarySeen = false;
  return safeActions.filter((action) => {
    if (action.style !== "primary") return true;
    if (primarySeen) return false;
    primarySeen = true;
    return true;
  });
}

export default function MessageList({
  messages,
  modelNumber,
  onCardAction,
  onQuickAction,
  quickActionsDisabled,
  onActionButtonPress,
  onActionsRendered
}) {
  const [actionStates, setActionStates] = useState({});
  const renderedActionsRef = useRef(new Set());

  useEffect(() => {
    const newlyRendered = [];
    for (const message of messages) {
      for (const action of sanitizeActions(message.actions || [])) {
        const key = `${message.id}:${action.id}`;
        if (!renderedActionsRef.current.has(key)) {
          renderedActionsRef.current.add(key);
          newlyRendered.push({ message, action });
        }
      }
    }
    if (newlyRendered.length) {
      onActionsRendered?.(newlyRendered);
    }
  }, [messages, onActionsRendered]);

  async function handleActionButtonClick(message, action) {
    const key = `${message.id}:${action.id}`;
    setActionStates((current) => ({
      ...current,
      [key]: { loading: true, failed: false, error: "", disabled: false }
    }));

    try {
      const result = await onActionButtonPress?.({ message, action });
      if (result?.ok) {
        setActionStates((current) => ({
          ...current,
          [key]: { loading: false, failed: false, error: "", disabled: true }
        }));
        return;
      }
      setActionStates((current) => ({
        ...current,
        [key]: {
          loading: false,
          failed: true,
          error: result?.error || "Action failed. Please try again.",
          disabled: Boolean(result?.disable)
        }
      }));
    } catch (error) {
      setActionStates((current) => ({
        ...current,
        [key]: {
          loading: false,
          failed: true,
          error: error?.message || "Action failed. Please try again.",
          disabled: true
        }
      }));
    }
  }

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

            {message.actions?.length ? (
              <div className="action-buttons">
                {sanitizeActions(message.actions || []).map((action) => {
                  const stateKey = `${message.id}:${action.id}`;
                  const state = actionStates[stateKey] || {};
                  const className = action.style === "primary" ? "action-button primary" : "action-button secondary";
                  return (
                    <div key={action.id} className="action-button-wrap">
                      <button
                        type="button"
                        className={className}
                        onClick={() => handleActionButtonClick(message, action)}
                        disabled={quickActionsDisabled || state.loading || state.disabled || action.enabled === false}
                      >
                        {state.loading ? "Working..." : action.label}
                      </button>
                      {state.failed ? <p className="error-text">{state.error}</p> : null}
                    </div>
                  );
                })}
              </div>
            ) : null}

            <CitationsDrawer citations={message.citations} />
          </div>
        </div>
      ))}
    </div>
  );
}
