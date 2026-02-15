# Action Buttons Spec

## Goal
Enable the assistant to return structured, clickable actions in chat that move users from product Q&A to conversion or next-best outcome.

## Initial Action Set
1. `checkout_now` (existing example)
2. `check_compatible_alternatives` (new)
3. `notify_when_in_stock` (new)

## 1) Checkout Now
### Why it is valuable
- Removes friction between product discussion and purchase.
- Converts high-intent users immediately after fit/spec confirmation.

### When to show
- Part is compatible with user model (or high-confidence fit).
- Part is in stock.
- Required quantity + part identifier are known.

### Payload
```json
{
  "id": "checkout_ps11750057",
  "type": "checkout_now",
  "label": "Checkout now",
  "style": "primary",
  "payload": {
    "psNumber": "PS11750057",
    "quantity": 1
  },
  "requiresConfirmation": true,
  "enabled": true
}
```

### Backend action
- `POST /api/checkout/session`
- Server creates checkout session and returns redirect URL/token.

## 2) Check Compatible Alternatives
### Why it is valuable
- Saves sessions when exact part has low fit confidence, is expensive, or out of stock.
- Lets users recover without rewriting their question.

### When to show
- Compatibility is low/unknown, or user asks for alternatives.
- At least one of: `modelNumber`, `psNumber`, `applianceType` exists.

### Payload
```json
{
  "id": "alternatives_ps11750057",
  "type": "check_compatible_alternatives",
  "label": "Show compatible alternatives",
  "style": "secondary",
  "payload": {
    "modelNumber": "WDT780SAEM1",
    "psNumber": "PS11750057",
    "applianceType": "dishwasher"
  },
  "enabled": true
}
```

### Backend action
- `POST /api/chat/actions/alternatives`
- Service returns alternative compatible parts + confidence + price/stock.

## 3) Notify When In Stock
### Why it is valuable
- Captures demand for backordered parts instead of losing users.
- Supports lifecycle re-engagement and conversion later.

### When to show
- Part is out of stock/backordered.
- User is authenticated or provides contact method.

### Payload
```json
{
  "id": "notify_ps12584610",
  "type": "notify_when_in_stock",
  "label": "Notify me when in stock",
  "style": "secondary",
  "payload": {
    "psNumber": "PS12584610",
    "channel": "email"
  },
  "enabled": true
}
```

### Backend action
- `POST /api/alerts/back-in-stock`
- Stores subscription for part + channel and returns confirmation state.

## Assistant Response Contract
```json
{
  "role": "assistant",
  "content": "PS11750057 is compatible with WDT780SAEM1.",
  "parts": [],
  "actions": []
}
```

Rules:
1. Maximum 3 actions per message.
2. Only one primary button.
3. Hide actions when prerequisites are missing.

## Safety + UX Rules
1. Financial actions (`checkout_now`) require confirmation.
2. Disable button and show inline error on API failure.
3. Never render out-of-scope actions (must remain fridge/dishwasher only).
4. Server validates payload (client payload is untrusted).

## Telemetry
Track:
1. `action_rendered`
2. `action_clicked`
3. `action_succeeded`
4. `action_failed`

Dimensions:
- `action_type`, `psNumber`, `modelNumber`, `intent`, `conversation_id`

## Acceptance Criteria
1. Assistant can return all three action types in structured payload.
2. Frontend renders clickable buttons from `actions[]`.
3. `checkout_now` starts checkout flow successfully.
4. `check_compatible_alternatives` returns at least one valid part when available.
5. `notify_when_in_stock` confirms subscription for backordered items.
