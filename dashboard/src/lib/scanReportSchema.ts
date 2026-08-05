import { z } from "zod";

// Mirrors the JSON shape written by src/report.py's build_report()/write_json(),
// plus commit metadata the GitHub Action attaches when it POSTs the report here.
export const obligationSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
});

export const findingSchema = z.object({
  file: z.string(),
  line: z.number().int(),
  vendor: z.string(),
  matched_signature: z.string(),
  call_source: z.string(),
  payload_args: z.record(z.string(), z.string()),
  function_scope: z.string().nullable(),
  risk_level: z.enum(["HIGH", "MEDIUM", "LOW"]),
  dataflow_reasons: z.array(z.string()),
  obligations: z.array(obligationSchema),
  remediation: z.string(),
});

export const scanUploadSchema = z.object({
  tool: z.literal("dpdp-ai-scanner"),
  scan_root: z.string(),
  generated_at: z.string(),
  summary: z.object({
    total_ai_call_sites: z.number().int(),
    high_risk: z.number().int(),
    medium_risk: z.number().int(),
    low_risk: z.number().int(),
  }),
  findings: z.array(findingSchema),
  commit_sha: z.string().min(1),
  branch: z.string().nullable().optional(),
  pr_number: z.number().int().nullable().optional(),
});

export type ScanUpload = z.infer<typeof scanUploadSchema>;
