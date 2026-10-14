// "How it works" illustration for Review rate (Anna Weber case). All data is made up (the repo is public).
(() => {
const blue = "var(--color-blue-4)", orange = "var(--color-orange-4)", green = "var(--color-green-4)";
const cfg = {
  fig: "Fig 1", caption: "Request flow · Review rate",
  alt: "Isometric illustration of one Review rate request: a monitor with the interface, a database, a prompt document, the Claude API and validation gates, joined by a loop. A plate carrying the current command or prompt travels around the loop.",
  ui: {
    title: "Contractors", button: "Review", spinner: "Reviewing",
    rows: [["Jaque Laurent", "€1,100"], ["Anna Weber", "€1,250"], ["Marco Rossi", "€880"]],
    card: `<text x="26" y="46" font-size="6.4">Suggested rate</text><text x="26" y="61" font-size="10" class="live">€1,250 → €1,100</text><rect class="detail" x="26" y="66" width="60" height="9" rx="3"/><text x="30" y="72.6" font-size="6" class="live">−12% · within limit</text><rect class="face" x="26" y="78" width="38" height="9" rx="3"/><text x="45" y="84.6" font-size="6" class="live" text-anchor="middle">Approve</text><rect class="detail" x="68" y="78" width="36" height="9" rx="3"/><text x="86" y="84.6" font-size="6" text-anchor="middle">Dismiss</text>`,
  },
  db: { label: "DATABASE" },
  sheet: {
    label: "PROMPT", title: "PROMPT", meta: "≈420 tok",
    blocks: [
      { tag: "SYSTEM", color: blue, bars: [82, 66] },
      { tag: "TOOL", color: orange, bars: [48, 70, 36] },
      { tag: "USER", color: green, bars: [30, 54] },
    ],
    chips: [[40, 102, 14], [62, 109, 14], [10, 109, 20]],
  },
  model: { caption: "CLAUDE API" },
  code: { file: "validate.ts", label: "CHECKS", lines: ["validate(answer, facts)", "shape ok?", "s <= facts.limit", "|delta| <= 15%", "s >= 0.7 * median", "return proposal"] },
  gates: ["limit", "±15%", "market"],
  steps: [
    { t: ["", ""], flow: "ready", out: "Anna Weber, EUR 1,250. Press Review (or Enter) to send the request.", title: "", desc: "" },
    { t: ["{ event: 'review_rate',", "  id: 'c_103' }"], flow: "interface > database", title: "Event",
      desc: "The click handler builds a small event and POSTs it to our own server. The row chip flips to “Reviewing…” at once (optimistic UI). The browser never holds a model key.",
      out: 'POST /api/agent/review-rate\n{ "event": "review_rate",\n  "contractorId": "c_103" }\n202 { "runId": "r_88" }' },
    { t: ["SELECT rate, limit", "FROM contracts WHERE id=$1"], flow: "database: query", title: "Query",
      desc: "The agent planner decides what to read and runs two parameterized queries on a read-only role. No model is involved yet.",
      out: "SELECT rate, project_limit FROM contracts\n  WHERE contractor_id = $1;\nSELECT daily_rate FROM contractors\n  WHERE country = $2 AND skill = $3 LIMIT 14;" },
    { t: ["{ rate: 1250, limit: 1100,", "  peers: 14, median: 1080 }"], flow: "database > prompt", title: "Facts",
      desc: "Rows are reduced to a few numbers in code: count, median, min, max. The model never receives raw rows, and the maths is not left to it.",
      out: '{ "rate": 1250, "limit": 1100,\n  "peers": { "n": 14, "median": 1080,\n             "min": 900, "max": 1300 } }' },
    { t: ["system + tool + user", "≈ 420 tokens"], flow: "prompt: text assembled", title: "Prompt",
      desc: "A template builds three parts: system rules, a propose_rate tool schema, and a user message with the facts dropped into slots. Roughly 420 tokens.",
      out: "system: answer only by calling propose_rate.\ntool:   propose_rate { suggested, reason, steps }\nuser:   Anna Weber, rate 1250, limit 1100,\n        14 similar, median 1080." },
    { t: ["POST /v1/messages", "{ tools: [propose_rate] }"], flow: "prompt > model", title: "Request",
      desc: "The server calls POST /v1/messages with the key from an environment variable. tool_choice forces propose_rate. 20 s timeout; 429 and 5xx are retried after 1, 2 and 4 s.",
      out: 'POST /v1/messages\n{ "model": "claude-sonnet-5-5",\n  "tools": [propose_rate],\n  "tool_choice": { "type": "tool", "name": "propose_rate" },\n  "messages": [ ... ] }' },
    { t: ["{ tool_use: propose_rate,", "  suggested: 1100 }"], flow: "model: answers", title: "Answer",
      desc: "The model answers with a tool_use block, not prose: structured input that code can read. About 180 output tokens in roughly two seconds.",
      out: '{ "stop_reason": "tool_use",\n  "input": { "suggested": 1100,\n    "reason": "14% above the project limit",\n    "steps": [ ... ] } }' },
    { t: ["limit ok · ±15% ok", "market ok"], flow: "model > checks", title: "Checks",
      desc: "validate() verifies shape, the project limit, a ±15% move and a market floor. One retry on a schema error. Any failed rule drops the proposal, so nothing reaches the screen.",
      out: "limit:   1100 <= 1100            ok\nchange:  -12% within 15%         ok\nmarket:  1100 >= 70% of median   ok" },
    { t: ["EUR 1,100   -12%", "within limit"], flow: "checks > interface", title: "Render",
      desc: "State becomes “proposal”, deltaPct is computed in code, the steps stream in and the card is drawn. Only Approve writes: PATCH /api/contractors/{id}, with Undo for 10 s.",
      out: 'state = "proposal"   // deltaPct: -12\nApprove > PATCH /api/contractors/c_103\n          { "rate": 1100 }\nDismiss > nothing is written' },
  ],
};
Flow.configs["review-rate"] = cfg;
const el = document.getElementById("flow");
if (el) Flow.mount(el, cfg);
})();
