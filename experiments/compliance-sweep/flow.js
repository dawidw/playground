// "How it works" illustration for Compliance sweep. All data is made up (the repo is public).
(() => {
const blue = "var(--color-blue-4)", orange = "var(--color-orange-4)", green = "var(--color-green-4)";
Flow.mount(document.getElementById("flow"), {
  fig: "Fig 2", caption: "Request flow · Compliance sweep",
  alt: "Isometric illustration of one compliance sweep: a monitor with the contractor list, a document store, a sheet of send rules, the Claude API that drafts one chase message, and guardrail gates, joined by a loop. A plate carrying the current command, rule or message travels around the loop.",
  ui: {
    title: "Contractors", button: "Check", spinner: "Checking",
    rows: [["Jaque Laurent", "Yes"], ["Tomas Novak", "No"], ["Jonas Novak", "No"]],
    card: `<text x="26" y="45" font-size="6.4">Sweep result</text><text x="26" y="58" font-size="9" class="live">6 clear · 2 need you</text><text x="26" y="68" font-size="6">Tomas · draft ready</text><text x="26" y="76" font-size="6">Jonas · needs you</text><rect class="face" x="26" y="79" width="46" height="9" rx="3"/><text x="49" y="85.6" font-size="5.8" class="live" text-anchor="middle">Review Tomas</text>`,
  },
  db: { label: "DOCUMENTS" },
  sheet: {
    label: "RULES", title: "SEND RULES", meta: "6 clear",
    blocks: [
      { tag: "EXPIRES", color: blue, bars: [70, 52] },
      { tag: "ESCALATE", color: orange, bars: [56, 70, 34] },
      { tag: "RESULT", color: green, bars: [30, 54] },
    ],
    chips: [[40, 102, 14], [62, 109, 14]],
  },
  model: { caption: "CLAUDE API" },
  code: { file: "guardrails.ts", label: "GUARDRAILS", lines: ["guardrails(draft, record)", "dates and names match?", "status stays draft", "no auto-send", "Jonas stays with a human", "return exceptions"] },
  gates: ["facts", "draft only", "escalate"],
  steps: [
    { t: ["", ""], flow: "ready", out: "8 contractors. Press Check (or Enter) to start the sweep.", title: "", desc: "" },
    { t: ["{ event: 'check_compliance',", "  scope: 'all', n: 8 }"], flow: "interface > documents", title: "Event",
      desc: "The Agent menu sends one event for the whole list. The panel opens at once with the steps as placeholders; nothing is decided in the browser.",
      out: 'POST /api/agent/check-compliance\n{ "event": "check_compliance",\n  "scope": "all", "contractors": 8 }\n202 { "runId": "r_91" }' },
    { t: ["SELECT doc_type, expires_on", "FROM documents WHERE ..."], flow: "documents: read", title: "Read",
      desc: "The agent reads documents, contracts and engagement history through a read-only role. One query per source, eight contractors, no model involved.",
      out: "SELECT doc_type, expires_on FROM documents\n  WHERE contractor_id = ANY($1);\nSELECT client, started_on FROM engagements\n  WHERE contractor_id = ANY($1);" },
    { t: ["8 contractors, 31 docs", "2 near a limit"], flow: "documents > rules", title: "Rows",
      desc: "Rows become one small record per person: documents with expiry dates, and who they work for and for how long. The rows stay on our server.",
      out: '{ "tomas": { "right_to_work": "2026-10-23" },\n  "jonas": { "engagements": 1, "months": 18 },\n  ...6 more, all valid beyond 90 days }' },
    { t: ["6 clear · 1 chase", "1 escalate"], flow: "rules: applied in code", title: "Rules",
      desc: "Plain code applies the send rules: a document that lapses within 14 days gets a chase, an unclear classification goes to a human. The chips on the table appear as rows are cleared.",
      out: "if (daysLeft <= 14)   draft a chase   // Tomas, 9 days\nif (months > 12 && clients === 1)\n                      escalate         // Jonas\nelse                  clear            // the other 6" },
    { t: ["POST /v1/messages", "draft: Tomas only"], flow: "rules > model", title: "Request",
      desc: "Only Tomas goes to the model, and only to write words: a short chase with his name, the document, the date and the project. Jonas is never sent. The agent will not classify him.",
      out: 'POST /v1/messages\n{ "tools": [draft_chase],\n  "messages": [ { "role": "user", "content":\n    "Tomas Novak, right to work expires 23 Oct,\n     SAP S/4HANA rollout" } ] }' },
    { t: ["{ tool_use: draft_chase,", "  text: 'Hi Tomas ...' }"], flow: "model: drafts", title: "Draft",
      desc: "The model returns the message as a structured tool call, so code can read it: a short, friendly chase with the date and what to send.",
      out: '{ "tool_use": { "name": "draft_chase",\n  "input": { "text": "Hi Tomas, your right to work\n    expires on 23 October. Please send the renewed\n    document so we can keep you on the SAP S/4HANA\n    rollout." } } }' },
    { t: ["facts ok · draft only", "Jonas stays human"], flow: "model > guardrails", title: "Guardrails",
      desc: "Guardrails compare the draft with the record: name, document and date must match. The status stays draft, nothing is sent on its own, and Jonas stays with a human.",
      out: "dates and names match the record     ok\nstatus stays 'draft', never 'sent'    ok\nJonas Novak: left to a human          ok" },
    { t: ["6 clear · 2 need you", "draft ready"], flow: "guardrails > interface", title: "Hand-off",
      desc: "The panel shows the result: six clear, a draft for Tomas, a decision for Jonas. Sending is a button the human presses. For Jonas the human picks Leave as freelancer or Flag risk, with Undo on both.",
      out: "6 clear · Tomas: draft ready · Jonas: needs you\n[ Review Tomas ]  then  [ Send message ]\nJonas: [ Leave as freelancer ] [ Flag risk ]" },
  ],
});
})();
