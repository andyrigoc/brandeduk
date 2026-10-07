#!/usr/bin/env python3
"""Generate Branded UK On-Site Chat Architecture PDF."""

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    KeepTogether,
    ListFlowable,
    ListItem,
    Paragraph,
    Preformatted,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

OUT = Path(__file__).resolve().parent / "Branded_UK_OnSite_Chat_Architecture.pdf"

# Brand-ish neutrals (not purple/cream AI defaults)
NAVY = colors.HexColor("#1B2A41")
INK = colors.HexColor("#1F2933")
MUTED = colors.HexColor("#52606D")
RULE = colors.HexColor("#D9E2EC")
SOFT = colors.HexColor("#F5F7FA")
ACCENT = colors.HexColor("#0F766E")  # teal — restraint
WARN_BG = colors.HexColor("#FEF3C7")
WARN_BORDER = colors.HexColor("#D97706")
WHITE = colors.white


def styles():
    base = getSampleStyleSheet()
    s = {
        "cover_title": ParagraphStyle(
            "cover_title",
            parent=base["Title"],
            fontName="Helvetica-Bold",
            fontSize=20,
            leading=26,
            textColor=NAVY,
            alignment=TA_CENTER,
            spaceAfter=6,
        ),
        "cover_sub": ParagraphStyle(
            "cover_sub",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=10,
            leading=14,
            textColor=MUTED,
            alignment=TA_CENTER,
            spaceAfter=4,
        ),
        "h1": ParagraphStyle(
            "h1",
            parent=base["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=13,
            leading=17,
            textColor=NAVY,
            spaceBefore=14,
            spaceAfter=8,
            borderPadding=0,
        ),
        "h2": ParagraphStyle(
            "h2",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=14,
            textColor=ACCENT,
            spaceBefore=10,
            spaceAfter=5,
        ),
        "body": ParagraphStyle(
            "body",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9.5,
            leading=13,
            textColor=INK,
            alignment=TA_JUSTIFY,
            spaceAfter=6,
        ),
        "body_left": ParagraphStyle(
            "body_left",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9.5,
            leading=13,
            textColor=INK,
            alignment=TA_LEFT,
            spaceAfter=5,
        ),
        "bullet": ParagraphStyle(
            "bullet",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9.5,
            leading=12.5,
            textColor=INK,
            leftIndent=0,
            spaceAfter=2,
        ),
        "mono": ParagraphStyle(
            "mono",
            parent=base["Code"],
            fontName="Courier",
            fontSize=8,
            leading=11,
            textColor=INK,
            backColor=SOFT,
            leftIndent=4,
            rightIndent=4,
            spaceBefore=4,
            spaceAfter=8,
        ),
        "table_cell": ParagraphStyle(
            "table_cell",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=11,
            textColor=INK,
        ),
        "table_head": ParagraphStyle(
            "table_head",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8.5,
            leading=11,
            textColor=WHITE,
        ),
        "callout": ParagraphStyle(
            "callout",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            textColor=INK,
            spaceAfter=3,
        ),
        "footer": ParagraphStyle(
            "footer",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8,
            textColor=MUTED,
            alignment=TA_CENTER,
        ),
        "meta": ParagraphStyle(
            "meta",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=11,
            textColor=MUTED,
            alignment=TA_LEFT,
            spaceAfter=3,
        ),
    }
    return s


def p(text, style):
    return Paragraph(text, style)


def make_table(headers, rows, col_widths, sty):
    head = [p(h, sty["table_head"]) for h in headers]
    body = [[p(c, sty["table_cell"]) for c in row] for row in rows]
    data = [head] + body
    t = Table(data, colWidths=col_widths, repeatRows=1)
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), NAVY),
                ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                ("BACKGROUND", (0, 1), (-1, -1), WHITE),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, SOFT]),
                ("GRID", (0, 0), (-1, -1), 0.4, RULE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return t


def bullets(items, sty):
    flow = []
    for item in items:
        flow.append(
            ListItem(p(item, sty["bullet"]), leftIndent=12, bulletColor=ACCENT)
        )
    return ListFlowable(
        flow,
        bulletType="bullet",
        start="•",
        leftIndent=14,
        bulletFontSize=8,
        spaceBefore=2,
        spaceAfter=6,
    )


def checklist(items, sty):
    flow = []
    for item in items:
        flow.append(
            ListItem(p(item, sty["bullet"]), leftIndent=12, bulletColor=NAVY)
        )
    return ListFlowable(
        flow,
        bulletType="bullet",
        start="☐",
        leftIndent=14,
        bulletFontSize=9,
        spaceBefore=2,
        spaceAfter=6,
    )


def warn_box(title, paragraphs, sty, width):
    inner = [p(f"<b>{title}</b>", sty["callout"])]
    for para in paragraphs:
        inner.append(p(para, sty["callout"]))
    inner_tbl = Table([[x] for x in inner], colWidths=[width - 12])
    inner_tbl.setStyle(
        TableStyle(
            [
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 1),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
            ]
        )
    )
    box = Table([[inner_tbl]], colWidths=[width])
    box.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), WARN_BG),
                ("BOX", (0, 0), (-1, -1), 1, WARN_BORDER),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    return box


def build():
    sty = styles()
    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=A4,
        leftMargin=16 * mm,
        rightMargin=16 * mm,
        topMargin=14 * mm,
        bottomMargin=14 * mm,
        title="Branded UK — On-Site Chat Architecture (n8n + Human Handoff)",
        author="Branded UK",
    )
    W = doc.width
    story = []

    # Cover
    story.append(Spacer(1, 6))
    story.append(p("Branded UK — On-Site Chat Architecture", sty["cover_title"]))
    story.append(p("(n8n + Human Handoff)", sty["cover_title"]))
    story.append(Spacer(1, 4))
    story.append(
        p(
            "Architecture guide for developers and operators wiring on-site chat "
            "on the Branded UK website.",
            sty["cover_sub"],
        )
    )
    story.append(
        p(
            "Scope: keep the customer conversation on the website · reuse the existing "
            "n8n chatbot · hand off to a human on a phone app when needed.",
            sty["cover_sub"],
        )
    )
    story.append(Spacer(1, 8))

    # Rule line
    line = Table([[""]], colWidths=[W])
    line.setStyle(
        TableStyle(
            [
                ("LINEBELOW", (0, 0), (-1, -1), 1.5, NAVY),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
    story.append(line)
    story.append(Spacer(1, 6))
    story.append(
        p(
            "<b>Audience:</b> developers &amp; operators &nbsp;|&nbsp; "
            "<b>Status:</b> architecture guide (implementation checklist in §7)",
            sty["meta"],
        )
    )

    # 1 Goal
    story.append(p("1. Goal", sty["h1"]))
    story.append(
        p(
            "Keep the entire customer conversation <b>on the Branded UK website</b>. "
            "The site widget talks to the existing n8n chatbot. When the customer asks "
            "to speak to someone, hand off to a team member on a phone app — then "
            "continue the conversation in the same on-site widget, like other modern chatbots.",
            sty["body"],
        )
    )
    story.append(
        make_table(
            ["Requirement", "Meaning"],
            [
                [
                    "Stay on-site",
                    "The customer never leaves the site to continue the chat.",
                ],
                [
                    "Reuse n8n",
                    "The widget talks to the <b>existing</b> n8n chatbot over a webhook.",
                ],
                [
                    "Keyword handoff",
                    'Phrases such as “I want to speak to someone” trigger a human handoff.',
                ],
                [
                    "Agent on phone",
                    "A team member is notified on a phone app (Telegram first; Chatwoot/Crisp later).",
                ],
                [
                    "Seamless continue",
                    "After handoff, replies still appear in the <b>same on-site widget</b>.",
                ],
            ],
            [38 * mm, W - 38 * mm],
            sty,
        )
    )
    story.append(Spacer(1, 6))
    story.append(
        p(
            "<b>Principle:</b> the customer UI is always the site widget. "
            "Agent tools (Telegram, etc.) are for <b>staff only</b>.",
            sty["body_left"],
        )
    )

    # 2 Flow
    story.append(p("2. Simple flow", sty["h1"]))
    story.append(p("Happy path (bot)", sty["h2"]))
    story.append(
        Preformatted(
            """Customer
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
Site chat widget  ←  customer sees the answer""",
            sty["mono"],
        )
    )
    story.append(p("Keyword handoff (human)", sty["h2"]))
    story.append(
        Preformatted(
            """1. Customer types a handoff phrase in the widget
   e.g. "I want to speak to someone" / "talk to a human"

2. n8n detects the keyword / intent
   → marks the session as "human mode"
   → notifies the agent channel (Telegram / Chatwoot / etc.)

3. Agent replies on their phone app

4. n8n routes the agent reply back to the same session chatId

5. Site widget shows the human reply
   → conversation continues in the widget until closed / returned to bot""",
            sty["mono"],
        )
    )
    story.append(
        p(
            "<b>One rule:</b> the customer channel is the website; the agent channel "
            "is the phone app. They meet in n8n via <font face='Courier'>chatId</font>.",
            sty["body_left"],
        )
    )

    # 3 Components
    story.append(p("3. Components", sty["h1"]))
    story.append(
        make_table(
            ["Component", "Role", "Notes"],
            [
                [
                    "<b>Site widget</b>",
                    "Customer chat UI on the website",
                    "Sends/receives messages; never opens external chat apps for the customer",
                ],
                [
                    "<b>n8n</b>",
                    "Orchestration + chatbot + handoff routing",
                    "Owns webhook, bot logic, keyword detection, session state, agent notify/reply",
                ],
                [
                    "<b>Session chatId</b>",
                    "Stable ID for one conversation",
                    "Ties widget ↔ n8n ↔ agent thread so replies return to the correct browser session",
                ],
                [
                    "<b>Agent channel</b>",
                    "Phone/desktop app for staff",
                    "Telegram (start); optional upgrade to Chatwoot, Crisp, or similar later",
                ],
            ],
            [32 * mm, 48 * mm, W - 80 * mm],
            sty,
        )
    )
    story.append(p("Session model (minimum)", sty["h2"]))
    story.append(
        bullets(
            [
                "Generate or persist a <font face='Courier'>chatId</font> when the widget opens (cookie / localStorage / server session).",
                "Send <font face='Courier'>chatId</font> with every message to n8n.",
                "Store mode: <font face='Courier'>bot</font> | <font face='Courier'>human</font>.",
                "When in human mode, skip chatbot replies and wait for agent input.",
                "When the agent (or timeout policy) ends handoff, return mode to bot.",
            ],
            sty,
        )
    )

    # 4 Keyword handoff
    story.append(p("4. Keyword → human handoff behaviour", sty["h1"]))
    story.append(
        bullets(
            [
                "<b>Detect</b> handoff intent in n8n (exact phrases and close variants).",
                "<b>Acknowledge</b> in the widget: e.g. “Connecting you to a team member. Please stay on this chat.”",
                "<b>Notify</b> the agent channel with: chatId, short transcript snippet, page URL if useful, timestamp.",
                "<b>Switch</b> session to human mode so the bot does not keep answering.",
                "<b>Relay</b> agent replies back to the widget for that chatId.",
                "<b>Close / return</b> when the agent marks done, the customer leaves, or a timeout fires (define a clear policy).",
            ],
            sty,
        )
    )
    story.append(
        p(
            "<b>Suggested starter phrases</b> (extend as needed): "
            "“I want to speak to someone” · “Talk to a human” · “Speak to an advisor” · "
            "“Human please” · “Customer service”",
            sty["body_left"],
        )
    )

    # 5 Stack
    story.append(p("5. Recommended starting stack", sty["h1"]))
    story.append(p("Phase 1 — ship fast", sty["h2"]))
    story.append(
        Preformatted(
            """Site widget  →  n8n webhook  →  existing chatbot
                    │
                    └─ on handoff → Telegram (agent notify + reply)
                                    → back to widget via chatId""",
            sty["mono"],
        )
    )
    story.append(
        make_table(
            ["Layer", "Choice", "Why"],
            [
                [
                    "Customer UI",
                    "On-site widget",
                    "Meets the stay-on-site goal",
                ],
                [
                    "Brain / routing",
                    "Existing n8n flows",
                    "Already built; add a handoff branch only",
                ],
                [
                    "Agent notify",
                    "Telegram bot/group",
                    "Fast to wire; works on phones",
                ],
            ],
            [32 * mm, 40 * mm, W - 72 * mm],
            sty,
        )
    )
    story.append(Spacer(1, 6))
    story.append(p("Phase 2 — optional upgrade", sty["h2"]))
    story.append(
        bullets(
            [
                "Move the agent inbox to <b>Chatwoot</b>, <b>Crisp</b>, or similar if you need shared inbox, assignment, SLAs, and history.",
                "Keep the customer on the <b>same site widget</b>; only change how agents work behind n8n.",
                "Do <b>not</b> redesign the customer path when upgrading the agent tool.",
            ],
            sty,
        )
    )

    # 6 Do NOT
    story.append(p("6. Things NOT to do", sty["h1"]))
    story.append(
        p(
            "These mistakes break the product goal. Treat them as <b>hard constraints</b>.",
            sty["body"],
        )
    )

    story.append(
        KeepTogether(
            [
                warn_box(
                    "Customer experience — stay on the website",
                    [
                        "• <b>Do NOT</b> open <font face='Courier'>wa.me</font>, WhatsApp Web, or any external WhatsApp link for the customer’s message. That kicks them off the site, puts the chat on WhatsApp, and produces the “Opening WhatsApp…” pattern we are explicitly avoiding.",
                        "• <b>Do NOT</b> use WhatsApp (or Telegram) as the <b>customer’s</b> chat channel if the goal is stay-on-site. Those apps may notify <b>agents only</b>.",
                        "• <b>Do NOT</b> replace the on-site widget with “message us on WhatsApp / Instagram / Messenger” as the primary support path for this feature.",
                        "• <b>Do NOT</b> force a new browser tab, deep link, or app switch mid-conversation for the customer.",
                    ],
                    sty,
                    W,
                )
            ]
        )
    )
    story.append(Spacer(1, 8))

    story.append(p("Agent tools vs customer UI", sty["h2"]))
    story.append(
        bullets(
            [
                "WhatsApp / Telegram / similar on the phone may be used <b>only</b> to alert the agent and collect the agent’s reply — <b>never</b> as the customer-facing UI.",
                "<b>Do NOT</b> conflate “agent got a Telegram ping” with “customer is now chatting on Telegram.” The customer stays in the widget.",
            ],
            sty,
        )
    )

    story.append(p("Site integrity", sty["h2"]))
    story.append(
        bullets(
            [
                "<b>Do NOT</b> remove or break PC mouse flows, navigation, shop, customise, basket, or other unrelated site features while wiring chat.",
                "<b>Do NOT</b> rewrite large areas of the site theme just to add a chat bubble. Prefer a contained widget + JS bridge to n8n.",
                "<b>Do NOT</b> block page interaction with an always-fullscreen chat overlay unless that is an explicit UX decision.",
            ],
            sty,
        )
    )

    story.append(p("Security and data", sty["h2"]))
    story.append(
        bullets(
            [
                "<b>Do NOT</b> send customer messages or PII to unsecured HTTP endpoints. Use <b>HTTPS only</b> for webhooks and APIs.",
                "<b>Do NOT</b> put secrets (n8n webhook tokens, Telegram bot tokens) in front-end JavaScript that customers can read. Keep secrets in n8n / server config.",
                "<b>Do NOT</b> log full card details, passwords, or unnecessary personal data in agent notifications or transcripts.",
            ],
            sty,
        )
    )

    story.append(p("Handoff quality", sty["h2"]))
    story.append(
        bullets(
            [
                "<b>Do NOT</b> leave the customer without an on-widget acknowledgement after a handoff keyword (“silence” feels broken).",
                "<b>Do NOT</b> let the bot keep auto-replying after human mode is active.",
                "<b>Do NOT</b> drop the <font face='Courier'>chatId</font> — without it, agent replies cannot return to the correct session.",
            ],
            sty,
        )
    )

    # 7 Checklist
    story.append(p("7. Next implementation steps", sty["h1"]))
    story.append(
        checklist(
            [
                "Confirm / document the existing n8n chatbot webhook URL and auth method",
                "Add or confirm a site chat widget that posts <font face='Courier'>{ chatId, message }</font> to n8n over HTTPS",
                "Persist <font face='Courier'>chatId</font> in the browser (and optionally server-side) for the session lifetime",
                "In n8n: add keyword/intent detection → set session mode <font face='Courier'>human</font> → notify Telegram",
                "In n8n: receive agent Telegram replies → map to <font face='Courier'>chatId</font> → push/poll back to the widget",
                "Widget UX: bot reply, “connecting you…”, human reply, and clear “chat ended / back to bot” states",
                "Test: bot-only path, handoff keyword, agent reply latency, refresh/reopen widget with same chatId",
                "Only later: evaluate Chatwoot/Crisp if Telegram is not enough for the team",
            ],
            sty,
        )
    )

    # Summary
    story.append(p("Summary", sty["h1"]))
    story.append(
        make_table(
            ["Do", "Don’t"],
            [
                [
                    "Keep chat in the site widget",
                    "Open WhatsApp / external apps for the customer",
                ],
                [
                    "Route through n8n + chatId",
                    "Lose session identity between widget and agent",
                ],
                [
                    "Notify agents on Telegram (upgrade inbox later if needed)",
                    "Treat agent apps as the customer channel",
                ],
                [
                    "Hand off on keyword and continue in-widget",
                    "Leave handoff silent or still bot-driven",
                ],
            ],
            [W / 2, W / 2],
            sty,
        )
    )
    story.append(Spacer(1, 10))
    story.append(
        p(
            "<b>Outcome:</b> customers stay on Branded UK; the existing n8n bot answers first; "
            "humans take over on the phone without breaking the on-site experience.",
            sty["body_left"],
        )
    )

    def on_page(canvas, doc_):
        canvas.saveState()
        canvas.setStrokeColor(RULE)
        canvas.setLineWidth(0.5)
        canvas.line(16 * mm, 10 * mm, A4[0] - 16 * mm, 10 * mm)
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(MUTED)
        canvas.drawString(16 * mm, 6 * mm, "Branded UK — On-Site Chat Architecture")
        canvas.drawRightString(A4[0] - 16 * mm, 6 * mm, f"Page {doc_.page}")
        canvas.restoreState()

    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    print(str(OUT))


if __name__ == "__main__":
    build()
