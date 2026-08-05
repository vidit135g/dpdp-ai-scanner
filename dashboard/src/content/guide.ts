export interface GuideSource {
  title: string;
  url: string;
}

export interface GuideSection {
  heading: string;
  body: string[];
}

export interface GuideArticle {
  slug: string;
  title: string;
  dek: string;
  readMinutes: number;
  updated: string; // ISO date
  sections: GuideSection[];
  sources: GuideSource[];
}

export const GUIDE_ARTICLES: GuideArticle[] = [
  {
    slug: "what-is-the-dpdp-act",
    title: "What is the DPDP Act?",
    dek: "India's first comprehensive personal data protection law — what it covers, who it applies to, and why it exists.",
    readMinutes: 4,
    updated: "2026-08-05",
    sections: [
      {
        heading: "Origins and purpose",
        body: [
          "The Digital Personal Data Protection Act, 2023 (DPDP Act) is India's first comprehensive law governing the processing of digital personal data. It received presidential assent on 11 August 2023, following years of deliberation that trace back to the Supreme Court's 2017 Puttaswamy judgment recognizing privacy as a fundamental right.",
          "The Act's stated purpose is to balance two things: an individual's right to protect their personal data, and the legitimate need of organizations to process that data for lawful purposes. It replaces the patchwork of data-related provisions that previously existed under the IT Act and its rules.",
        ],
      },
      {
        heading: "What counts as \"personal data\"",
        body: [
          "The Act covers digital personal data — data about an identifiable individual, whether collected digitally or collected offline and later digitized. If your product, script, or AI integration touches information that can identify a person (name, email, phone number, government ID, location, behavioral data, and similar), it is very likely in scope.",
        ],
      },
      {
        heading: "Who it applies to — including outside India",
        body: [
          "The DPDP Act applies to the processing of digital personal data within India. Critically, it also applies extraterritorially: processing done outside India is covered if it relates to offering goods or services to individuals located in India. A SaaS company based abroad that serves Indian users is not exempt simply because its servers or AI vendor sit outside the country.",
        ],
      },
      {
        heading: "The two key roles: Data Fiduciary and Data Principal",
        body: [
          "A Data Fiduciary is any person or organization that determines the purpose and means of processing personal data — in most cases, this is the company operating the product or service. A Data Principal is the individual to whom the personal data relates — your user or customer. The Act builds almost all of its obligations around this Fiduciary-Principal relationship.",
        ],
      },
    ],
    sources: [
      { title: "Digital Personal Data Protection Act, 2023 (Wikipedia)", url: "https://en.wikipedia.org/wiki/Digital_Personal_Data_Protection_Act,_2023" },
      { title: "THE DIGITAL PERSONAL DATA PROTECTION ACT, 2023 (No. 22 of 2023) — official text, MeitY", url: "https://www.meity.gov.in/static/uploads/2024/06/2bf1f0e9f04e6fb4f8fef35e82c42aa5.pdf" },
      { title: "India's Digital Personal Data Protection Act 2023 brought into force", url: "https://www.hlc.com/en/publications/indias-digital-personal-data-protection-act-2023-brought-into-force-" },
    ],
  },
  {
    slug: "rights-and-obligations",
    title: "Data Principal rights & Data Fiduciary obligations",
    dek: "What individuals can demand, and what every organization handling their data must do in return.",
    readMinutes: 5,
    updated: "2026-08-05",
    sections: [
      {
        heading: "Consent is the default legal basis",
        body: [
          "Under Section 6, personal data may generally be processed only with the free, specific, informed, unconditional, and unambiguous consent of the Data Principal. A consent request must be presented in clear, plain language, offer the option of English or any of the Eighth Schedule languages, and include the contact details of a Data Protection Officer or other authorized contact.",
          "Consent can be withdrawn at any time, as easily as it was given — Section 6(4) makes withdrawal a first-class right, not an afterthought buried in settings.",
          "Section 7 carves out specific \"legitimate uses\" where consent isn't required — for example, when a Data Principal voluntarily provides data for a stated purpose, for compliance with a legal obligation, or in medical emergencies. These are narrow exceptions, not a general opt-out.",
        ],
      },
      {
        heading: "What Data Principals can demand",
        body: [
          "Every Data Principal has four core rights under the Act: the right to access a summary of what personal data is being processed and why; the right to correction, completion, updating, and erasure of that data; the right to grievance redressal directly with the organization (escalating to the Data Protection Board if unresolved); and the right to nominate another individual to exercise these rights on their behalf, including after death or incapacity.",
        ],
      },
      {
        heading: "Baseline obligations on every Data Fiduciary",
        body: [
          "Data Fiduciaries must process data only for the purpose consented to, keep data accurate and complete, implement reasonable security safeguards to prevent breaches, and notify both the Data Protection Board and affected Data Principals in the event of a personal data breach.",
          "Data must not be retained longer than necessary for the stated purpose (subject to legal retention requirements), and Fiduciaries must establish a clear grievance-redressal mechanism.",
        ],
      },
      {
        heading: "Processing through a third party doesn't shift the liability",
        body: [
          "A Data Fiduciary remains responsible for compliance even when processing is carried out by a Data Processor engaged under contract — including third-party AI/LLM vendors. This is the core reason a code-level scan matters: every call to an external AI API is, legally, still your obligation to answer for, not the vendor's.",
        ],
      },
    ],
    sources: [
      { title: "Rights of Data Principals — DPDPA", url: "https://dpdpaedu.org/docs/Overview/Rights%20of%20Data%20Principals/" },
      { title: "Data Principal Rights Under the DPDP Act (Vratex)", url: "https://www.vratex.com/dpdp-act/data-principal-rights" },
      { title: "Chapter 2 — Obligations of Data Fiduciary, DPDP Act 2023", url: "https://www.dpdpact2023.com/chapter-2" },
      { title: "AI Training Data under India's DPDP Regime (Khurana & Khurana)", url: "https://www.khuranaandkhurana.com/ai-training-data-under-india-s-dpdp-regime-compliance-challenges-and-strategies" },
    ],
  },
  {
    slug: "ai-vendors-and-cross-border-transfer",
    title: "AI vendors, cross-border transfer & why this matters for your code",
    dek: "Sending data to OpenAI, Anthropic, or any third-party AI API is a cross-border data transfer under Indian law — here's what that triggers.",
    readMinutes: 5,
    updated: "2026-08-05",
    sections: [
      {
        heading: "Sending data to an AI model is \"processing\"",
        body: [
          "The Act's definition of processing is broad and automated-by-default: any wholly or partly automated operation on personal data. Passing a variable into an LLM API call — a chat message, a support ticket, a user record — is processing under Section 2(x), whether or not a human ever reviews it.",
        ],
      },
      {
        heading: "Section 16 governs the cross-border leg",
        body: [
          "Most AI vendor APIs (OpenAI, Anthropic, Azure OpenAI, Google's Generative AI, and others) process requests on infrastructure outside India. Section 16 adopts a \"negative list\" model: transfers are permitted to any country by default, unless the Central Government specifically restricts that destination by notification.",
          "As of this writing, no country has been placed on a restricted list. That does not mean cross-border AI calls are unconditionally clear — the DPDP Rules, 2025 and future notifications can still impose procedural conditions on transfers generally, and the absence of a restriction today is not a permanent guarantee.",
        ],
      },
      {
        heading: "A Data Processing Agreement is expected, not optional",
        body: [
          "Where an AI vendor is acting as a Data Processor, the Data Fiduciary is expected to have a valid contract in place covering purpose limitation, data categories, security obligations, and deletion requirements — proceeding without one exposes the organization to a Section 8(2) compliance gap once that obligation comes fully into force.",
        ],
      },
      {
        heading: "Why static code scanning is a reasonable first check",
        body: [
          "Because the obligation attaches to the Data Fiduciary regardless of which vendor's API is called, the practical question engineering teams need answered is narrow and code-level: which call sites in this codebase send personal data to a third-party AI processor, and has anyone verified consent, a DPA, and retention terms for that specific path? That is deliberately the scope this scanner targets — it is a triage aid to surface those call sites, not a substitute for a compliance program.",
        ],
      },
    ],
    sources: [
      { title: "India's DPDP Rules — Cross-Border Data Transfers Explained (MediaNama)", url: "https://www.medianama.com/2025/11/223-dpdp-rules-cross-border-data-transfers/" },
      { title: "Cross-Border Data Transfers Under India's DPDP Act (Lexology)", url: "https://www.lexology.com/library/detail.aspx?g=ce5725ab-e3c8-4070-855d-0519e36dead9" },
      { title: "DPDP Act 2023: Impact on Artificial Intelligence (Trilegal)", url: "https://trilegal.com/dataprotection/dpdpforai/" },
      { title: "What DPDP Act Rule 6 Requires When Your Organisation Uses AI (Mavs AI)", url: "https://mavsai.ai/blog/dpdp-act-rule-6-ai-compliance" },
    ],
  },
  {
    slug: "penalties-and-enforcement",
    title: "Penalties, the Data Protection Board & Significant Data Fiduciaries",
    dek: "Fines run up to ₹250 crore per violation. Here's who enforces the Act and who faces extra obligations.",
    readMinutes: 4,
    updated: "2026-08-05",
    sections: [
      {
        heading: "The Data Protection Board of India",
        body: [
          "The Data Protection Board of India (DPBI) is the Act's enforcement authority, empowered under Section 33 to investigate breaches and impose financial penalties. The Telecom Disputes Settlement and Appellate Tribunal (TDSAT) serves as the appellate body for Board decisions. Before any penalty is imposed, the concerned organization is given an opportunity to be heard.",
        ],
      },
      {
        heading: "How large the penalties are",
        body: [
          "Penalties under the Schedule to the Act range from ₹10,000 up to ₹250 crore per violation, scaled to the nature, gravity, and repetitive nature of the breach, the sensitivity of the data involved, whether the violator benefited financially, and any mitigation steps taken. Failure to take reasonable security safeguards — the provision most directly triggered by an unmanaged AI data-transfer path — sits at the top of that range.",
          "Penalties apply per violation, not per incident: an organization found to have breached multiple provisions in one episode can face separate penalties stacked for each one.",
        ],
      },
      {
        heading: "Significant Data Fiduciaries carry extra weight",
        body: [
          "The Central Government can designate certain organizations as Significant Data Fiduciaries (SDFs) based on factors like the volume and sensitivity of data processed. SDFs inherit every baseline obligation in the Act and add several more under Section 10: appointing a India-based Data Protection Officer, engaging an independent data auditor, and conducting a Data Protection Impact Assessment (DPIA) and audit at least once every twelve months. Non-compliance with these SDF-specific duties can itself draw a penalty of up to ₹150 crore.",
        ],
      },
    ],
    sources: [
      { title: "Section 33 — Penalties, DPDPA with interpretation", url: "https://www.dpdpa.com/dpdpa2023/chapter-8/section33.html" },
      { title: "DPDP Act Penalties: Fines Up to ₹250 Crore (TCSA)", url: "https://www.tcsa.in/frameworks/dpdp/penalties-enforcement" },
      { title: "Significant Data Fiduciary (SDF) Under DPDP Act — Complete Guide (Vakilsearch)", url: "https://vakilsearch.com/article/significant-data-fiduciary-sdf/" },
      { title: "Obligations of Significant Data Fiduciaries (Tsaaro)", url: "https://tsaaro.com/blogs/obligations-of-significant-data-fiduciaries-under-the-dpdp-act-2023-and-dpdp-rules-2025/" },
    ],
  },
  {
    slug: "dpdp-timeline",
    title: "DPDP timeline: what's live now, what's still coming",
    dek: "The Act commenced in phases. Knowing which obligations are already enforceable — and which have runway — changes how urgently a finding should be treated.",
    readMinutes: 3,
    updated: "2026-08-05",
    sections: [
      {
        heading: "Phase I — 13 November 2025 (in force)",
        body: [
          "The DPDP Rules, 2025 were notified on 13/14 November 2025, formally operationalizing the Act after incorporating feedback from over 6,900 public submissions on the draft rules. Phase I brought the institutional machinery to life immediately: the Data Protection Board of India began being constituted and staffed, giving the Act a functioning enforcement body for the first time.",
        ],
      },
      {
        heading: "Phase II — 13 November 2026 (Consent Managers)",
        body: [
          "Provisions governing Consent Managers — SEBI-style registered intermediaries through which individuals can give, manage, and withdraw consent across multiple organizations — come into force twelve months after notification. Consent Managers must be Indian-incorporated companies with a minimum net worth of ₹2 crore and interoperable, secure platforms.",
        ],
      },
      {
        heading: "Phase III — 13 May 2027 (full substantive compliance)",
        body: [
          "The bulk of the Act's substantive machinery — consent notice requirements, the full slate of Data Principal rights, breach-notification duties, security-safeguard obligations, and Data Processing Agreement requirements for processors including AI vendors — comes into force eighteen months after notification. Organizations have until this date to reach full compliance, but the practical guidance from advisory firms is consistent: governance structures and privacy frameworks should be in place well before the deadline, not built in the final months.",
        ],
      },
      {
        heading: "Why the phasing matters for a HIGH-risk finding today",
        body: [
          "A HIGH-risk finding from this scanner today points at a call site that will need a documented legal basis, a Data Processing Agreement, and cross-border transfer diligence by 13 May 2027 at the latest — and the Data Protection Board already exists to receive complaints in the interim. Treating these findings as a backlog item rather than a pre-launch blocker is a reasonable calibration for most teams, but the runway is not indefinite.",
        ],
      },
    ],
    sources: [
      { title: "Digital Personal Data Protection (DPDP) Rules, 2025 — PIB press release", url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2190655" },
      { title: "Digital Personal Data Protection Rules, 2025 (Wikipedia)", url: "https://en.wikipedia.org/wiki/Digital_Personal_Data_Protection_Rules,_2025" },
      { title: "Enforcement of the DPDP Act and notification of the DPDP rules (Shardul Amarchand Mangaldas)", url: "https://www.amsshardul.com/insight/enforcement-of-the-dpdp-act-and-notification-of-the-dpdp-rules/" },
      { title: "DPDP Rules 2025: India's Complete Compliance Guide (Seclore)", url: "https://www.seclore.com/fundamentals/dpdp-rules-2025-compliance-guide/" },
    ],
  },
];

export function getGuideArticle(slug: string): GuideArticle | undefined {
  return GUIDE_ARTICLES.find((a) => a.slug === slug);
}
