/**
 * DegreeLabs Impact Fellowship (DLIF) — Canonical Terminology Constants
 *
 * Source of Truth:
 * - DLIF Fellow Handbook — DISCOVER (v1.0, Sept 2026)
 * - Cikitsa India — DLIF Fellow Company & Project Brief
 */

export const PROGRAM_NAME = "DegreeLabs Impact Fellowship" as const;
export const PROGRAM_SHORT_NAME = "DLIF" as const;

export const HANDBOOK_INFO = {
  title: "DLIF Fellow Handbook — DISCOVER (v1.0, Sept 2026)",
  shortTitle: "DLIF Fellow Handbook",
  version: "v1.0 (Sept 2026)",
  phase: "DISCOVER",
} as const;

export const PHASES = {
  DISCOVER: {
    name: "DISCOVER",
    action: "THINK",
    full: "DISCOVER (THINK)",
    description: "A 4-week strategic problem-solving apprenticeship.",
    weeks: 4,
  },
  VALIDATE: {
    name: "VALIDATE",
    action: "PROVE",
    full: "VALIDATE (PROVE)",
    duration: "4 weeks",
  },
  GROW: {
    name: "GROW",
    action: "DELIVER",
    full: "GROW (DELIVER)",
    duration: "3–6 months",
  },
  TRIAD: "DISCOVER (THINK) → VALIDATE (PROVE) → GROW (DELIVER)",
} as const;

export const PORTAL_NAMES = {
  FELLOW: "Fellow Portal",
  MENTOR: "Mentor Portal",
  ADMIN: "Admin Portal",
} as const;

export const ROLES = {
  FELLOW: "Fellow",
  DEDICATED_TEAM_MENTOR: "Dedicated Team Mentor",
  COMPANY_CHALLENGE_OWNER: "Company Challenge Owner",
  INDUSTRY_MENTOR: "Industry Mentor",
  ACADEMIC_MENTOR: "Academic Mentor",
  ADMIN: "Administrator",
} as const;

export const WORK_CONCEPTS = {
  COMPANY_CHALLENGE: "Company challenge",
  WEEKLY_OUTPUT: "Weekly output",
  REQUIRED_WORKING_EVIDENCE: "Required Working Evidence",
  REFLECTION_JOURNAL: "Reflection journal",
  PROOF_OF_WORK: "Proof of Work (PoW)",
  GATE_REVIEW: "Gate Review",
  DISCOVER_PROGRESS: "DISCOVER Progress",
} as const;

export const DISCOVER_CURRICULUM = {
  week1: {
    weekNumber: "WEEK 01",
    title: "DISCOVER THE REAL PROBLEM",
    coreQuestion: "What is really happening here?",
    output: "Business Diagnosis & Problem Framing Pack",
    sessions: [
      { id: "s0", number: "Session 0", title: "DLIF Onboarding & Program Setup" },
      { id: "s1", number: "Session 1: Learn + Work", title: "Business Context & Evidence" },
      { id: "s2", number: "Session 2: Learn + Work", title: "Problem Framing & Diagnosis" },
      { id: "s3", number: "Session 3: Output + Review (Gate)", title: "Business Diagnosis & Problem Framing Pack Review" },
    ],
  },
  week2: {
    weekNumber: "WEEK 02",
    title: "CREATE STRATEGIC POSSIBILITIES",
    coreQuestion: "What could we choose to do?",
    output: "Strategic Possibility & Choice Pack",
    sessions: [
      { id: "s4", number: "Session 4: Learn + Work", title: "Research & Possibility Generation" },
      { id: "s5", number: "Session 5: Learn + Work", title: "What Would Have to Be True? (WWHTBT)" },
      { id: "s6", number: "Session 6: Output + Review (Gate)", title: "Strategic Choice Review" },
    ],
  },
  week3: {
    weekNumber: "WEEK 03",
    title: "DESIGN THE STRATEGY",
    coreQuestion: "If this is our choice, how will it actually work?",
    output: "Strategy & Execution Blueprint",
    sessions: [
      { id: "s7", number: "Session 7: Learn + Work", title: "Integrated Strategy Choices" },
      { id: "s8", number: "Session 8: Learn + Work", title: "Execution Architecture" },
      { id: "s9", number: "Session 9: Output + Review (Gate)", title: "Strategy Review" },
    ],
  },
  week4: {
    weekNumber: "WEEK 04",
    title: "BUILD THE CASE FOR ACTION",
    coreQuestion: "Why should the company believe us?",
    outputs: [
      "Executive Proposal",
      "Company Presentation",
      "Strategic Design Portfolio",
    ],
    sessions: [
      { id: "s10", number: "Session 10: Learn + Work", title: "Proposal Architecture" },
      { id: "s11", number: "Session 11: Learn + Work", title: "Executive Communication" },
      { id: "s12", number: "Session 12: Output + Review (Gate)", title: "Final DISCOVER Review" },
    ],
  },
} as const;

export const DISCOVER_CAPABILITIES = [
  "Business Understanding",
  "Evidence & Problem Framing",
  "Strategic Choice",
  "Execution Thinking",
  "Professional Communication",
] as const;
