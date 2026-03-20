# BeeGraded — Full Platform Scope Document

**Product:** BeeGraded — "Get BeeGraded before you get graded"
**Version:** 0.2 — Platform Vision (expanded from MVP)
**Date:** 19 February 2026
**Author:** Risk-Asure

---

## 1. Vision

BeeGraded starts as a pay-as-you-go academic paper evaluation tool (R20/paper) and evolves into a **student intelligence platform** — building learning profiles over time, teaching critical thinking per subject, and connecting students to career opportunities, financial services, and resources.

**The paper evaluation is the trojan horse. The student profile is the real asset.**

---

## 2. Platform Layers (Build Order)

### Layer 1: Evaluation Engine (MVP — Built)
- Upload .docx → AI evaluation → HTML report
- Mode A (Academic Quality) + Mode B (Turnitin Ready)
- Dual 5W1H chain: Positive (strengths) + Negative (issues) with 5 Whys drill-down
- Draft-to-final comparison with anti-monkey detection
- Dynamic senior lecturer persona based on subject field
- R20/paper, PayFast payment

### Layer 2: Student Profile (3-6 months)
- Aggregate evaluation data across papers/subjects/semesters
- Learning trajectory dashboard — improving, plateauing, or declining
- Strengths and weakness patterns across subjects
- Bloom's Taxonomy level tracking (where is the student operating?)
- Free for students — this is the retention hook

### Layer 3: Critical Thinking Toolkit (6-12 months)
- Subject-specific critical thinking "mental moves" library
- Subject deconstruction engine (Bloom's levels per course)
- Simulation exercises with instant AI feedback
- Progress tracking across exercises
- Tiered pricing (Gold, Platinum)

### Layer 4: Institutional Analytics (12-18 months)
- University-facing dashboard with anonymised, aggregated data
- Class-wide weakness patterns ("60% can't do critical analysis — root cause: X")
- Custom rubric upload — evaluate against the actual rubric the lecturer uses
- Credit/batch pricing model (not flat annual fee)

### Layer 5: Student Marketplace (18-24 months)
- Career matching (employers pay to reach students by field/profile)
- Bursary/student loan matching (vetted providers only)
- Accommodation (res/private housing, especially Jan-Feb registration season)
- Textbooks and stationery (targeted by subject)
- Graduate recruitment pipeline

---

## 3. Product Tiers

| Tier | Name | Price | Includes |
|---|---|---|---|
| Basic | BeeGraded | R20/paper | Evaluation report + dual 5W1H chain + draft-final comparison |
| Gold | BeeGraded+ | R75/subject | Basic + Subject Critical Thinking Toolkit + 5 practice exercises |
| Platinum | BeeGraded Pro | R150/semester | Gold + full subject deconstruction + simulation scenarios + unlimited exercises + progress tracking |
| Institutional | BeeGraded Campus | Credit batches (e.g. 500 evals = R8,000) | All tiers for enrolled students + lecturer analytics dashboard + custom rubric upload |

### Institutional Credit Model
- Universities buy evaluation credits in batches
- Priced per evaluation, not flat annual
- Easier to get through procurement (per-module budgets, per-semester)
- Example pricing: 500 credits = R8,000 (R16/eval), 2000 credits = R24,000 (R12/eval), 5000 credits = R50,000 (R10/eval)
- Credits allocated to modules/lecturers who distribute to students
- Usage analytics provided to faculty

---

## 4. The Evaluation Framework

### Three-Hat AI Persona (Dynamic)
The Claude prompt adopts the role of a **senior lecturer in {subject}** wearing three hats:
1. **Subject Expert** — Is the content correct, deep, and properly applied?
2. **Experienced Marker** — Does this meet academic standards and rubric criteria?
3. **Mentor** — Help the student understand root learning patterns (good and bad)

The `{subject}` is dynamically replaced from the student's upload metadata.

**IMPORTANT:** The AI must be genuinely knowledgeable in the subject. If the prompt creates false contradictions between sources (e.g. claiming two authors disagree when they don't), it destroys credibility. The subject expert hat is not cosmetic — it must be accurate. Where the AI is uncertain about subject-specific claims, it should flag uncertainty rather than fabricate.

### Cross-Question Consistency Check
The evaluation compares how the student uses sources and arguments ACROSS all questions, not just within each one. Flags:
- Same author cited to support opposing arguments in different questions
- A concept defined/applied differently across questions
- Student's own position shifts without acknowledgement
- A framework praised in one answer but its limitations ignored in another

For each inconsistency, the AI determines the **verdict**:
- **Genuine nuance** — the sources DO address different contexts at the principle level. This is acceptable and shows sophistication. The student should acknowledge it explicitly.
- **Misunderstanding** — the student has misapplied the source. Costs marks.
- **Contradiction** — the student directly contradicts themselves. Critical fix.

### Dual 5W1H Chain

**Positive Chain (Strengths):**
- WHAT: What the student did well
- WHERE: Exact location in paper
- WHY chain: Why it works → why that matters → reusable pattern (2-4 levels)
- HOW: Which rubric criterion it serves
- WHO: Who notices (marker, moderator, examiner)

**Negative Chain (Issues):**
- WHAT: The specific issue
- WHERE: Exact location in paper
- WHY chain: 5 Whys drill-down from surface problem to root learning gap (2-5 levels)
- HOW: Concrete fix with before/after example
- WHO: Who catches this (marker, Turnitin, moderator)
- WHEN: Priority (critical/important/polish)

### Scoring Rubric (Default)
- Knowledge & Understanding: 25%
- Critical Analysis: 25%
- Application: 20%
- Referencing & Academic Practice: 15%
- Structure & Presentation: 15%

Custom rubrics supported at Institutional tier — lecturer uploads their rubric, evaluation scores against it.

---

## 5. Critical Thinking Toolkit (Gold/Platinum)

### The Problem
Every rubric demands "critical thinking" (25% of marks) but nobody teaches it as a practical skill. And critical thinking is **subject-specific** — the mental moves in Law are different from Engineering are different from Business.

### Tool 1: Subject Mental Moves Library
Per-subject tutorial generated by AI that teaches the specific critical thinking moves for that field.

**Example — Supply Chain Management:**
1. Challenge the assumption ("Does this framework apply in developing markets?")
2. Compare frameworks ("Author A says X, Author B says Y — who's more applicable here?")
3. Apply to context ("In this specific case study, the theory breaks because...")
4. Identify limitations ("This model assumes stable suppliers, but what if...")
5. Evaluate evidence ("This study is from 2006 — has the landscape changed?")
6. Synthesise ("Combining these two approaches gives us a more robust strategy")

**Example — Criminal Law:**
1. Distinguish cases ("The facts in S v X differ from the current case because...")
2. Challenge precedent ("This ratio decidendi may not apply given...")
3. Statutory interpretation ("Section 35(3) could be read to mean...")
4. Policy argument ("The court should consider the societal impact of...")
5. Comparative analysis ("In the UK jurisdiction, this was handled differently...")

Each subject gets its own move set, generated dynamically by Claude.

### Tool 2: Subject Deconstruction Engine
Break any subject into Bloom's Taxonomy levels:

```
Level 1 — REMEMBER: Define terms, list categories, recall frameworks
Level 2 — UNDERSTAND: Explain concepts, summarise theories, describe processes
Level 3 — APPLY: Use framework on case study, apply theory to real scenario
Level 4 — ANALYSE: Compare authors, break down arguments, identify patterns
Level 5 — EVALUATE: Judge effectiveness, assess applicability, critique limitations
Level 6 — CREATE: Design new strategy, propose solution, synthesise framework
```

Student uploads course outline or assessment brief → AI maps it to Bloom's levels → shows them:
- Where they're currently operating (usually Level 2-3)
- Where the marks are (Level 4-5)
- What "the next level up" looks like with concrete examples

### Tool 3: Simulation Exercises
Practice scenarios with instant AI feedback. **Subject-specific, never the same exercise twice.**

**Exercise types:**
- **"Strengthen this paragraph"** — weak descriptive paragraph → student rewrites critically → AI scores with 5W1H
- **"Find the counter-argument"** — claim presented → student argues against it using sources
- **"Source evaluation"** — reference presented → student assesses credibility, recency, relevance
- **"Case application"** — theory + case study → student bridges them with analysis
- **"Spot the AI"** — two paragraphs (human vs AI-generated) → student identifies which and why

**Subject-Specific Simulations:**

The simulation tool goes beyond writing exercises. For subjects with quantitative or systems-thinking elements, students can test strategies under real-world conditions.

**Example — Supply Chain Bullwhip Simulator:**
1. Student proposes a strategy: "Move all stock to last-mile stores. Empty the central warehouse."
2. System simulates under normal conditions → looks stable, low lead times
3. System applies stress conditions:
   - **COVID lockdown**: Last-mile stores can't receive replenishment. No central buffer. Stockouts cascade. Bullwhip amplifies.
   - **Seasonal demand spike**: Last-mile stores lack capacity for surge. Lost sales. Bullwhip whips harder.
   - **Supplier disruption**: Single point of failure with no central buffer to absorb the shock.
4. Student sees the consequences of their strategy visualised
5. AI explains: "Your strategy optimises for normal conditions but creates fragility under disruption. This is the exact trade-off Tang (2006) and Christopher (2016) discuss — efficiency vs resilience."
6. Student revises strategy → re-simulates → learns through consequence, not just theory

**This is experiential learning — a flight simulator for academic thinking.**

Other simulation examples:
- **Finance:** "Here's a portfolio. Simulate it through the 2008 crash, COVID-19, and rising interest rates."
- **Project Management:** "Here's your project plan. What happens when a key resource leaves in Week 3?"
- **Marketing:** "Here's your campaign strategy. Simulate competitor response and market saturation."
- **Health Sciences:** "Patient presents with X symptoms. What's your differential diagnosis? Now add new test results."

Progress tracking across exercises:
```
Week 1: Bloom Level 2 (Understand) — mostly descriptive responses
Week 3: Bloom Level 3-4 (Apply/Analyse) — starting to compare and question
Week 6: Bloom Level 4-5 (Analyse/Evaluate) — consistent critical analysis
```

---

## 6. Student Profile Data Model

### What We Know After 20 Papers Across 3 Years

| Data Point | Source | Value |
|---|---|---|
| What they study | Upload metadata | Faculty, major, specialisation |
| Which institution | Email domain + subject | University, campus |
| Year of study | Progressive tracking | 1st year → final year |
| Subject strengths | Positive 5W1H chains | Patterns across papers |
| Subject weaknesses | Negative 5W1H chains + root causes | Recurring learning gaps |
| Bloom's level per subject | Evaluation + exercise scores | Operating level over time |
| Academic trajectory | Draft-final + semester-over-semester | Improving, plateauing, declining |
| Critical thinking development | Exercise progress tracking | Mental moves mastered |
| Activity patterns | Timestamps | Exam seasons, assignment cycles |
| Graduation timing | Year progression | Career transition window |

### Profile Uses
1. **For the student:** "Here's your learning dashboard. You're strong in application but weak in critical analysis across all subjects. Here's your pattern."
2. **For the institution:** (anonymised, aggregated) "60% of your 3rd-year Supply Chain students have the same root cause gap in critical analysis."
3. **For employers:** (student opt-in only) "These final-year students have strong analytical profiles in your industry."
4. **For service providers:** (curated, vetted) "Students studying in Johannesburg, 2nd year, might need accommodation options."

---

## 7. Revenue Model

### Per-Student Revenue

| Tier | Price | Students/month | Revenue |
|---|---|---|---|
| Basic (R20/paper) | R20 | 5,000 | R100,000 |
| Gold (R75/subject) | R75 | 1,000 | R75,000 |
| Platinum (R150/semester) | R150 | 500 | R75,000 |
| **Subtotal** | | | **R250,000/month** |

### Institutional Revenue

| Package | Price | Institutions | Revenue |
|---|---|---|---|
| 500 credits | R8,000 | 10 | R80,000/batch |
| 2000 credits | R24,000 | 5 | R120,000/batch |
| 5000 credits | R50,000 | 3 | R150,000/batch |

### Marketplace Revenue (Phase 5)

| Source | Model | Est. Revenue |
|---|---|---|
| Career matching / recruitment | R500-5000 per hire | Variable |
| Bursary/loan lead gen | R200-500 per qualified lead | Variable |
| Accommodation lead gen | R100-200 per lead | Seasonal (Jan-Feb) |
| Textbook/supplies affiliate | 5-10% commission | Ongoing |

---

## 8. Data Privacy (POPIA Compliance)

- Explicit opt-in consent at registration for profile building
- Clear disclosure: what data is collected, how it's used, who sees what
- Individual results NEVER shared with institutions — only anonymised aggregates
- Student can delete their entire profile at any time (right to be forgotten)
- Financial services advertising: vetted providers only, no predatory lenders
- Student must opt-in separately for marketplace features (career matching, etc.)
- Data retention: evaluation data kept for duration of studies + 1 year, then anonymised

---

## 9. Technical Architecture (Full Platform)

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Quasar SPA)                 │
│  Student App: Evaluate │ Learn │ Dashboard │ Marketplace │
│  Lecturer Portal: Analytics │ Rubric Upload │ Credits    │
│  Employer Portal: Graduate Search │ Profile Browse       │
└─────────────────────┬───────────────────────────────────┘
                      │ REST API
┌─────────────────────┴───────────────────────────────────┐
│                    n8n / API Layer                        │
│  Auth │ Upload │ Payment │ Evaluation │ Exercises        │
│  Profile │ Analytics │ Marketplace │ Simulation          │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────┐
│                    AI Engine (Claude API)                 │
│  Evaluation Prompt │ Critical Thinking Generator          │
│  Subject Deconstruction │ Simulation Engine               │
│  Exercise Generator │ Profile Analysis                    │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────┐
│                    PostgreSQL                             │
│  Users │ Papers │ Evaluations │ Strengths │ Issues       │
│  Profiles │ Exercises │ Simulations │ Credits │ Payments  │
└─────────────────────────────────────────────────────────┘
```

---

## 10. Build Phases

| Phase | Timeline | What | Revenue |
|---|---|---|---|
| 1 | Now (Week 1-5) | MVP: Evaluate + Pay + Report | R20/paper |
| 2 | Month 3-6 | Student profile dashboard + learning trajectory | Retention (free) |
| 3 | Month 6-12 | Critical Thinking Toolkit + exercises + simulations | Gold R75, Platinum R150 |
| 4 | Month 12-18 | Institutional licensing + lecturer dashboard + custom rubrics | Credit batches R8-50k |
| 5 | Month 18-24 | Marketplace (careers, bursaries, accommodation, supplies) | Lead gen / affiliate |

---

## 11. Key Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| AI generates false subject claims | High — destroys credibility | Flag uncertainty, don't fabricate. Subject expert hat must be genuine. |
| University backlash ("AI assistance") | High — could ban usage | Position as learning/pedagogical tool. The 5 Whys + simulations are genuinely educational. |
| POPIA violations | Critical — legal liability | Explicit consent, anonymised aggregates, right to delete, vetted partners only. |
| Student loan advertising ethics | Medium — reputational | Only vetted, low-interest providers. No predatory lenders. Frame as bursary matching. |
| AI commoditisation | Medium — competition | The 5W1H + 5 Whys framework + subject simulations are the moat. Hard to replicate the full system. |
| Low initial adoption | Medium — cash flow | R20 impulse price + WhatsApp virality + exam season campaigns. |
| Students copy AI suggestions verbatim | Medium — academic risk | Anti-monkey detection already built. Simulations teach thinking, not provide answers. |

---

## 12. Honest Notes

### On the Citation Example Problem
During development, we created examples using Tang (2006) and Christopher (2016) in supply chain management. The user correctly flagged that these citations might contradict each other in ways the AI fabricated rather than accurately represented. This proves:
- The AI must be genuinely knowledgeable in the subject, not just sound confident
- Where uncertain, the prompt must flag uncertainty rather than invent academic claims
- Subject-specific simulation tools (like the bullwhip simulator) should be grounded in established models, not improvised

### On Critical Thinking as the Core Product
The real insight: BeeGraded's long-term value isn't evaluating papers — it's **teaching critical thinking as a subject-specific, practical skill through simulation and experiential learning.** The evaluation is the diagnostic. The toolkit is the treatment. The simulations are the practice field.

---

*Document prepared: 19 February 2026*
*Risk-Asure — BeeGraded Division*
