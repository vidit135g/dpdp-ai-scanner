# DPDP AI Exposure Scan Report

**Scan root:** `../examples/sample_app.py`  
**Generated:** 2026-08-05T07:05:20.330100+00:00

## Summary

- Total AI call sites found: **4**
- High risk (likely personal data to third-party AI vendor): **2**
- Medium risk (manual review recommended): **1**
- Low risk / baseline: **1**

## Findings

### 1. openai call at `../examples/sample_app.py:18`

- **Risk level:** HIGH
- **Function scope:** summarize_support_ticket
- **Call:** `openai.ChatCompletion.create(model='gpt-4', messages=[{'role': 'user', 'content': prompt_text}])`
  - payload arg `messages` = `[{'role': 'user', 'content': prompt_text}]`
- **Reasoning:**
  - Payload arg 'messages' traces to `prompt_text = f"Customer: {customer_email}\nTicket: {ticket_body}"`, PII-flavored
- **Obligations triggered:**
  - **DPDP-S8-CONSENT** — Section 8 — Data Fiduciary obligations / legal basis for processing: Personal data appears to be transmitted to a third-party AI processor. Confirm a valid legal basis exists: either informed consent under Section 6, or one of the legitimate-use exemptions under Section 7.
  - **DPDP-S16-TRANSFER** — Section 16 — Cross-border data transfer: Most AI vendor APIs process data outside India. Confirm the destination is not a restricted jurisdiction and that transfer conditions are met.
  - **DPDP-PROCESSOR-DPA** — Data Processor Agreement: Confirm a data processing agreement is on file with this AI vendor, defining purpose limitation, retention, and deletion obligations for the data being sent.
- **Remediation:** Verify the legal basis for this call, confirm a DPA exists with the vendor, and document the retention/deletion terms before this code path ships to production with real user data.

### 2. anthropic call at `../examples/sample_app.py:29`

- **Risk level:** HIGH
- **Function scope:** handle_chat_request
- **Call:** `client.messages.create(model='claude-3-opus-20240229', messages=[{'role': 'user', 'content': user_message}])`
  - payload arg `messages` = `[{'role': 'user', 'content': user_message}]`
- **Reasoning:**
  - Payload arg 'messages' traces to `user_message = request.json.get("message")`, incoming data source
- **Obligations triggered:**
  - **DPDP-S8-CONSENT** — Section 8 — Data Fiduciary obligations / legal basis for processing: Personal data appears to be transmitted to a third-party AI processor. Confirm a valid legal basis exists: either informed consent under Section 6, or one of the legitimate-use exemptions under Section 7.
  - **DPDP-S16-TRANSFER** — Section 16 — Cross-border data transfer: Most AI vendor APIs process data outside India. Confirm the destination is not a restricted jurisdiction and that transfer conditions are met.
  - **DPDP-PROCESSOR-DPA** — Data Processor Agreement: Confirm a data processing agreement is on file with this AI vendor, defining purpose limitation, retention, and deletion obligations for the data being sent.
- **Remediation:** Verify the legal basis for this call, confirm a DPA exists with the vendor, and document the retention/deletion terms before this code path ships to production with real user data.

### 3. openai call at `../examples/sample_app.py:38`

- **Risk level:** MEDIUM
- **Function scope:** generate_report_summary
- **Call:** `openai.ChatCompletion.create(model='gpt-4', messages=[{'role': 'user', 'content': data}])`
  - payload arg `messages` = `[{'role': 'user', 'content': data}]`
- **Reasoning:**
  - Payload arg 'messages' uses a generic variable name (`data`), manual review recommended
- **Obligations triggered:**
  - **DPDP-REVIEW-NEEDED** — Manual review recommended: The payload naming is too generic to classify automatically. A human reviewer should confirm whether personal data is present.
- **Remediation:** Manually inspect this call site to confirm whether personal data is included in the payload before assuming it is clear.

### 4. openai call at `../examples/sample_app.py:48`

- **Risk level:** LOW
- **Function scope:** get_style_suggestions
- **Call:** `openai.ChatCompletion.create(model='gpt-4', messages=[{'role': 'system', 'content': system_prompt}])`
  - payload arg `messages` = `[{'role': 'system', 'content': system_prompt}]`
- **Reasoning:**
  - No PII-flavored naming or known incoming-data source detected in payload expression(s)
- **Obligations triggered:**
  - **DPDP-BASELINE-AWARENESS** — Baseline third-party transfer awareness: No personal-data indicators were detected, but any call to a third-party AI vendor is still a data transfer worth logging in your AI system inventory for audit-readiness.
- **Remediation:** No immediate action required. Log this vendor in your AI system inventory for completeness.
