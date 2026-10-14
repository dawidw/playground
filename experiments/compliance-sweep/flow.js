// "How it works" illustration for Compliance sweep: a belt, a sorter and three lanes. All data is made up (the repo is public).
(() => {
const cfg = {
  scene: "sweep",
  fig: "Fig 2", caption: "Request flow · Compliance sweep",
  alt: "Isometric illustration of one compliance sweep: eight contractors ride a belt past a document store into a rules sorter. Six go straight to a clear bin, one goes to the model for a drafted message and then through guardrail gates to an outbox, and one goes to a desk where a person decides.",
  ui: {
    title: "Contractors", button: "Check", spinner: "Checking",
    rows: [["Jaque Laurent", "Yes"], ["Tomas Novak", "No"], ["Jonas Novak", "No"]],
    card: `<text x="26" y="45" font-size="6.4">Sweep result</text><text x="26" y="58" font-size="9" class="live">6 clear · 2 need you</text><text x="26" y="68" font-size="6">Tomas · draft ready</text><text x="26" y="76" font-size="6">Jonas · needs you</text><rect class="face" x="26" y="79" width="46" height="9" rx="3"/><text x="49" y="85.6" font-size="5.8" class="live" text-anchor="middle">Review Tomas</text>`,
  },
  db: { label: "DOCUMENTS" },
  sorter: { label: "RULES", title: "RULES", sub: "in code" },
  bin: { label: "CLEAR" },
  model: { label: "MODEL", caption: "CLAUDE API" },
  tray: { label: "OUTBOX" },
  desk: { label: "YOU", name: "Jonas Novak", line: "needs a decision", a: "Leave", b: "Flag" },
  gates: ["facts", "draft only", "no send"],
  steps: [
    { t: ["", ""], flow: "ready", out: "8 contractors. Press Check (or Enter) to start the sweep.", title: "", desc: "" },
    { t: ["{ event: 'check_compliance',", "  scope: 'all', n: 8 }"], flow: "interface > belt", title: "Event",
      desc: "The Agent menu sends one event for the whole list and the eight contractors step onto the belt. The panel opens at once with the steps as placeholders; nothing is decided in the browser.",
      out: 'POST /api/agent/check-compliance\n{ "event": "check_compliance",\n  "scope": "all", "contractors": 8 }\n202 { "runId": "r_91" }' },
    { t: ["SELECT doc_type, expires_on", "FROM documents WHERE ..."], flow: "belt > documents", title: "Read",
      desc: "The belt runs past the document store. The agent reads documents, contracts and engagement history through a read-only role: one query per source, eight contractors, no model involved.",
      out: "SELECT doc_type, expires_on FROM documents\n  WHERE contractor_id = ANY($1);\nSELECT client, started_on FROM engagements\n  WHERE contractor_id = ANY($1);" },
    { t: ["daysLeft <= 14 ? chase", "unclear ? escalate"], flow: "documents > rules > 3 lanes", title: "Sort",
      desc: "Plain code applies the send rules to each person and the belt splits into three lanes. A document that lapses within 14 days gets a chase, an unclear classification goes to a human, everyone else is clear.",
      out: "if (daysLeft <= 14)   draft a chase   // Tomas, 9 days\nif (months > 12 && clients === 1)\n                      escalate         // Jonas\nelse                  clear            // the other 6" },
    { t: ["6 clear", "no action"], flow: "rules > clear", title: "Clear",
      desc: "Six people pass without a word: documents valid for months, ordinary engagements. The table only gets a quiet green “Clear” chip. Nothing is written and nothing is sent.",
      out: "chips: Clear x 6\nwritten: nothing\nsent: nothing" },
    { t: ["POST /v1/messages", "draft: Tomas only"], flow: "lane 2: tomas > model", title: "Request",
      desc: "Only Tomas goes to the model, and only to write words: a short chase with his name, the document, the date and the project. Jonas is never sent. The agent will not classify him.",
      out: 'POST /v1/messages\n{ "tools": [draft_chase],\n  "messages": [ { "role": "user", "content":\n    "Tomas Novak, right to work expires 23 Oct,\n     SAP S/4HANA rollout" } ] }' },
    { t: ["{ tool_use: draft_chase,", "  text: 'Hi Tomas ...' }"], flow: "model: drafts", title: "Draft",
      desc: "The model returns the message as a structured tool call, so code can read it: a short, friendly chase with the date and what to send.",
      out: '{ "tool_use": { "name": "draft_chase",\n  "input": { "text": "Hi Tomas, your right to work\n    expires on 23 October. Please send the renewed\n    document so we can keep you on the SAP S/4HANA\n    rollout." } } }' },
    { t: ["facts ok · draft only", "never auto-sent"], flow: "model > guardrails > outbox", title: "Guardrails",
      desc: "Guardrails compare the draft with the record: name, document and date must match. The status stays draft and nothing is sent on its own. The message waits in the outbox.",
      out: "dates and names match the record     ok\nstatus stays 'draft', never 'sent'    ok\nsending needs a person                ok" },
    { t: ["Tomas: draft ready", "Jonas: needs you"], flow: "outbox + desk wait for you", title: "Hand-off",
      desc: "The panel shows the result: six clear, a draft for Tomas, a decision for Jonas. Sending is a button the human presses. For Jonas the human picks Leave as freelancer or Flag risk, with Undo on both.",
      out: "6 clear · Tomas: draft ready · Jonas: needs you\n[ Review Tomas ]  then  [ Send message ]\nJonas: [ Leave as freelancer ] [ Flag risk ]" },
  ],
};
Flow.configs["compliance-sweep"] = cfg;
const el = document.getElementById("flow");
if (el) Flow.mount(el, cfg);
})();
