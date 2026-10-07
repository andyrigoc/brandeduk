# Branded UK — On-Site Chat Architecture (n8n + Human Handoff)

**Audience:** developers and operators wiring chat on the Branded UK website  
**Scope:** keep the customer conversation on the website, reuse the existing n8n chatbot, and hand off to a human on a phone app when needed  
**Status:** architecture guide (implementation checklist below)

---

## 1. Goal

Keep the entire customer conversation **on the Branded UK website**.

| Requirement | Meaning |
|---|---|
| Stay on-site | The customer never leaves the site to continue the chat |
| Reuse n8n | The site widget talks to the **existing** n8n chatbot over a webhook |
| Keyword handoff | Phrases such as *“I want to speak to someone”* trigger a human handoff |
| Agent on phone | A team member is notified on a phone app (Telegram first; Chatwoot/Crisp later) |
| Seamless continue | After handoff, replies still appear in the **same on-site widget** — like other modern chatbots |

The customer UI is always the site widget. Agent tools (Telegram, etc.) are for **staff only**.

---

## 2. Simple flow

### Happy path (bot)

```
Customer
   │
   ▼
Site chat widget
   │  POST message + session chatId
   ▼
n8n webhook
   │
   ▼
Existing chatbot logic (n8n)
   │  reply text
   ▼
Site chat widget  ←  customer sees the answer
```

### Keyword handoff (human)

```
1. Customer types a handoff phrase in the widget
   e.g. "I want to speak to someone" / "talk to a human"

2. n8n detects the keyword / intent
   → marks the session as "human mode"
   → notifies the agent channel (Telegram / Chatwoot / etc.)

3. Agent replies on their phone app

4. n8n routes the agent reply back to the same session chatId

5. Site widget shows the human reply
   → conversation continues in the widget until closed / returned to bot
```

**One rule:** the customer channel is the website; the agent channel is the phone app. They meet in n8n via `chatId`.

---

## 3. Components

| Component | Role | Notes |
|---|---|---|
| **Site widget** | Customer chat UI embedded on the website | Sends/receives messages; never opens external chat apps for the customer |
| **n8n** | Orchestration + chatbot + handoff routing | Owns webhook, bot logic, keyword detection, session state, agent notify/reply |
| **Session `chatId`** | Stable ID for one customer conversation | Ties widget ↔ n8n ↔ agent thread so replies return to the correct browser session |
| **Agent channel** | Phone/desktop app for staff | Telegram (start); optional upgrade to Chatwoot, Crisp, or similar later |

### Session model (minimum)

- Generate or persist a `chatId` when the widget opens (cookie / localStorage / server session).
- Send `chatId` with every message to n8n.
- Store mode: `bot` | `human`.
- When in `human` mode, skip chatbot replies and wait for agent input.
- When the agent (or timeout policy) ends handoff, return mode to `bot`.

---

## 4. Keyword → human handoff behaviour

1. **Detect** handoff intent in n8n (exact phrases and close variants).
2. **Acknowledge** in the widget: e.g. *“Connecting you to a team member. Please stay on this chat.”*
3. **Notify** the agent channel with: `chatId`, short transcript snippet, page URL if useful, timestamp.
4. **Switch** session to human mode so the bot does not keep answering.
5. **Relay** agent replies back to the widget for that `chatId`.
6. **Close / return** when the agent marks done, the customer leaves, or a timeout fires (define a clear policy).

Suggested starter phrases (extend as needed):

- “I want to speak to someone”
- “Talk to a human”
- “Speak to an advisor”
- “Human please”
- “Customer service”

---

## 5. Recommended starting stack

**Phase 1 (ship fast)**

```
Site widget  →  n8n webhook  →  existing chatbot
                    │
                    └─ on handoff → Telegram (agent notify + reply)
                                    → back to widget via chatId
```

| Layer | Choice | Why |
|---|---|---|
| Customer UI | On-site widget | Meets the stay-on-site goal |
| Brain / routing | Existing n8n flows | Already built; add handoff branch only |
| Agent notify | Telegram bot/group | Fast to wire; works on phones |

**Phase 2 (optional upgrade)**

- Move agent inbox to **Chatwoot**, **Crisp**, or similar if you need shared inbox, assignment, SLAs, and history.
- Keep the customer on the **same site widget**; only change how agents work behind n8n.

Do not redesign the customer path when upgrading the agent tool.

---

## 6. Things NOT to do

These mistakes break the product goal. Treat them as hard constraints.

### Customer experience — stay on the website

- **Do NOT** open `wa.me`, WhatsApp Web, or any external WhatsApp link for the customer’s message. That kicks them off the site, puts the chat on WhatsApp, and produces the “Opening WhatsApp…” pattern we are explicitly avoiding.
- **Do NOT** use WhatsApp (or Telegram) as the **customer’s** chat channel if the goal is stay-on-site. Those apps may notify **agents only**.
- **Do NOT** replace the on-site widget with “message us on WhatsApp / Instagram / Messenger” as the primary support path for this feature.
- **Do NOT** force a new browser tab, deep link, or app switch mid-conversation for the customer.

### Agent tools vs customer UI

- WhatsApp / Telegram / similar on the phone may be used **only** to alert the agent and collect the agent’s reply — **never** as the customer-facing UI.
- **Do NOT** conflate “agent got a Telegram ping” with “customer is now chatting on Telegram.” The customer stays in the widget.

### Site integrity

- **Do NOT** remove or break PC mouse flows, navigation, shop, customise, basket, or other unrelated site features while wiring chat.
- **Do NOT** rewrite large areas of the site theme just to add a chat bubble. Prefer a contained widget + JS bridge to n8n.
- **Do NOT** block page interaction with an always-fullscreen chat overlay unless that is an explicit UX decision.

### Security and data

- **Do NOT** send customer messages or PII to unsecured HTTP endpoints. Use **HTTPS** only for webhooks and APIs.
- **Do NOT** put secrets (n8n webhook tokens, Telegram bot tokens) in front-end JavaScript that customers can read. Keep secrets in n8n / server config.
- **Do NOT** log full card details, passwords, or unnecessary personal data in agent notifications or transcripts.

### Handoff quality

- **Do NOT** leave the customer without an on-widget acknowledgement after a handoff keyword (“silence” feels broken).
- **Do NOT** let the bot keep auto-replying after human mode is active.
- **Do NOT** drop the `chatId` — without it, agent replies cannot return to the correct session.

---

## 7. Next implementation steps

- [ ] Confirm / document the existing n8n chatbot webhook URL and auth method
- [ ] Add or confirm a site chat widget that posts `{ chatId, message }` to n8n over HTTPS
- [ ] Persist `chatId` in the browser (and optionally server-side) for the session lifetime
- [ ] In n8n: add keyword/intent detection → set session mode `human` → notify Telegram
- [ ] In n8n: receive agent Telegram replies → map to `chatId` → push/poll back to the widget
- [ ] Widget UX: bot reply, “connecting you…”, human reply, and clear “chat ended / back to bot” states
- [ ] Test: bot-only path, handoff keyword, agent reply latency, refresh/reopen widget with same `chatId`
- [ ] Only later: evaluate Chatwoot/Crisp if Telegram is not enough for the team

---

## Summary

| Do | Don’t |
|---|---|
| Keep chat in the site widget | Open WhatsApp / external apps for the customer |
| Route through n8n + `chatId` | Lose session identity between widget and agent |
| Notify agents on Telegram (then upgrade inbox if needed) | Treat agent apps as the customer channel |
| Hand off on keyword and continue in-widget | Leave handoff silent or still bot-driven |

**Outcome:** customers stay on Branded UK; the existing n8n bot answers first; humans take over on the phone without breaking the on-site experience.
