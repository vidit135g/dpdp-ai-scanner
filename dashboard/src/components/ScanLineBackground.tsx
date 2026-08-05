const CODE_LINES = [
  "import openai",
  "from flask import request",
  "",
  "def summarize_support_ticket(ticket_body):",
  "    customer_email = request.json.get('email')",
  "    prompt_text = f\"Customer: {customer_email}\\nTicket: {ticket_body}\"",
  "    return openai.ChatCompletion.create(",
  "        model='gpt-4',",
  "        messages=[{'role': 'user', 'content': prompt_text}],",
  "    )",
  "",
  "def handle_chat_request():",
  "    user_message = request.json.get('message')",
  "    return client.messages.create(",
  "        model='claude-3-opus-20240229',",
  "        messages=[{'role': 'user', 'content': user_message}],",
  "    )",
  "",
  "# DPDP-S8-CONSENT  Section 8 — legal basis for processing",
  "# DPDP-S16-TRANSFER  Section 16 — cross-border data transfer",
  "# DPDP-PROCESSOR-DPA  Data Processor Agreement required",
];

export default function ScanLineBackground() {
  const lines = [...CODE_LINES, ...CODE_LINES];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-canvas" aria-hidden="true">
      <pre className="select-none whitespace-pre font-mono text-[13px] leading-6 text-white/[0.22] sm:text-sm">
        {lines.map((line, i) => (
          <div key={i} className={line.startsWith("#") ? "text-[var(--risk-high-ink)]/40" : undefined}>
            {line || " "}
          </div>
        ))}
      </pre>
      <div className="scan-line absolute inset-x-0 h-24" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-canvas" />
    </div>
  );
}
