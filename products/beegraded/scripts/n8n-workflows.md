# BeeGraded — n8n Workflow Specifications

## Overview
8 workflows, all using PostgreSQL + HTTP endpoints.

---

## Workflow 1: Auth (Magic Link)

### Endpoint: `POST /auth/magic-link`
**Input:** `{ email: string }`
**Steps:**
1. Check if user exists in `users` table by email
2. If not, create user record
3. Generate random 64-char token (`crypto.randomBytes(32).toString('hex')`)
4. Store token + expiry (15 min from now) in `users` table
5. Send email via SMTP/SendGrid with magic link: `{FRONTEND_URL}/#/verify?token={token}`
6. Return `{ success: true, message: "Magic link sent" }`

### Endpoint: `POST /auth/verify`
**Input:** `{ token: string }`
**Steps:**
1. Query `users` where `magic_token = token AND token_expires_at > NOW()`
2. If not found, return `{ error: "Invalid or expired token" }` (401)
3. Clear `magic_token` and `token_expires_at`
4. Generate JWT (HS256, 7-day expiry) with payload: `{ user_id, email }`
5. Return `{ token: jwt, user: { id, email, name } }`

---

## Workflow 2: Upload + Payment Init

### Endpoint: `POST /papers/upload`
**Input:** multipart form — `file` (binary), `subject`, `assessment_type`, `num_questions`
**Steps:**
1. Save file to temp directory
2. Execute Command: `python scripts/extract_text.py /tmp/upload_{uuid}.docx`
3. Parse JSON output → get `text`, `word_count`, `page_count`
4. Insert into `papers` table (user_id from JWT, or null for quick check)
5. Return `{ paper_id: int, word_count: int, page_count: int }`

### Endpoint: `POST /payments/initiate`
**Input:** `{ paper_id, mode, email, name }`
**Steps:**
1. Generate unique `m_payment_id` (format: `BG-{paper_id}-{timestamp}`)
2. Build PayFast form fields:
   - `merchant_id`, `merchant_key` from env
   - `return_url`: `{FRONTEND_URL}/#/thank-you?paper_id={paper_id}`
   - `cancel_url`: `{FRONTEND_URL}/#/cancel`
   - `notify_url`: `{API_URL}/payfast-itn`
   - `amount`: `20.00`
   - `item_name`: `BeeGraded Paper Evaluation`
   - `item_description`: `Mode {mode} evaluation for {subject}`
3. Generate MD5 signature: sort fields alphabetically, URL-encode values, concatenate as `key=value&`, append passphrase, MD5 hash
4. Insert into `payments` table (status: pending)
5. Return `{ fields: {...}, payfast_url: "https://sandbox.payfast.co.za/eng/process" }`

**PayFast Signature Generation (JavaScript):**
```javascript
const crypto = require('crypto');

function generateSignature(data, passphrase) {
  const params = Object.keys(data)
    .filter(key => data[key] !== '' && key !== 'signature')
    .sort()
    .map(key => `${key}=${encodeURIComponent(data[key]).replace(/%20/g, '+')}`)
    .join('&');

  const withPassphrase = passphrase ? `${params}&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}` : params;
  return crypto.createHash('md5').update(withPassphrase).digest('hex');
}
```

---

## Workflow 3: PayFast ITN (Webhook)

### Endpoint: `POST /payfast-itn`
**Input:** PayFast form POST body
**Steps:**
1. **Validate signature:** Rebuild signature from received fields + passphrase, compare to received `signature`
2. **Validate source IP:** Check against PayFast IP ranges (197.97.145.144/28, etc.)
3. **Validate payment data:** `amount` matches expected R20.00, `payment_status` = `COMPLETE`
4. **Confirm with PayFast:** POST received data back to `https://sandbox.payfast.co.za/eng/query/validate` — must return `VALID`
5. Update `payments` record: set `status = 'complete'`, `payfast_payment_id`
6. **Trigger Workflow 4** (Evaluation Pipeline) with `paper_id` and `mode`
7. Return HTTP 200 (empty body — PayFast expects this)

---

## Workflow 4: Evaluation Pipeline (Internal)

**Triggered by:** Workflow 3 (after payment confirmed)
**Input:** `{ paper_id, mode }`
**Steps:**
1. Query `papers` for `paper_text`, `subject`, `assessment_type`, `num_questions`
2. Build Claude API prompt (see below)
3. Call Claude API (Haiku 4.5 primary, Sonnet 4.5 fallback if >5000 words)
4. Parse structured JSON response
5. Insert into `evaluations` table (scores, mode, draft_or_final)
6. Insert into `reference_audit` table (each citation match)
7. Insert into `evaluation_issues` table (each issue found)
8. Generate HTML report from template + evaluation data
9. Store `report_html` in evaluations record
10. Log to `usage_tracking` (model used, tokens, cost)

### Claude API — Mode A Prompt (Academic Quality)

**Framework: Rubric Scoring + Dual 5W1H Chains (Positive + Negative) + 5 Whys**

Every finding — both strengths and weaknesses — uses the **5W1H** structure with a **Why chain**:

**POSITIVE CHAIN (strengths):**
- **What** — what the student did well
- **Where** — exact location in the paper
- **Why** chain — drill down into WHY it works and earns marks (so the student can deliberately repeat it)
- **How** — how it strengthens the paper / which criterion it boosts
- **Who** — who notices (marker, moderator, peer reviewer)

**NEGATIVE CHAIN (issues):**
- **What** — the specific issue
- **Where** — exact location in the paper
- **Why** chain — drill down from surface problem to **root learning gap** (5 Whys)
- **How** — concrete fix with before/after example
- **Who** — who notices this (marker, Turnitin, moderator)
- **When** — priority order (critical first, polish last)

The **5 Whys** drill-down stops when it hits an actionable root. Not every finding needs all 5 levels — stop when you reach something the student can act on. Typical depth: 2-4 levels.

**Example POSITIVE Why chain:**
1. Why did this earn marks? → You compared Tang (2006) against Christopher (2016) rather than just citing one
2. Why is comparing effective? → It shows you can evaluate competing arguments, not just report them
3. Why does evaluation matter? → It demonstrates higher-order thinking — markers score this under Critical Analysis (25%)
4. **Root strength:** You naturally apply a "but what does another author say?" reflex — keep doing this across ALL your answers

**Example NEGATIVE Why chain:**
1. Why did you lose marks? → You described Tang's framework instead of analysing it
2. Why did you describe instead of analyse? → You presented the source as fact, not as an argument to evaluate
3. Why did you treat it as fact? → You didn't compare it against a different author's view
4. Why didn't you compare? → You haven't developed the habit of asking "but what if this doesn't hold true in my case study context?"
5. **Root cause:** Missing critical thinking reflex — always ask "so what?" and "what if not?" after every source you cite

```
System: You are a senior lecturer in {subject} with 15 years of marking experience
at postgraduate level. You evaluate academic papers wearing three hats:
1. SUBJECT EXPERT — Is the content correct, deep, and properly applied?
2. EXPERIENCED MARKER — Does this meet academic standards and rubric criteria?
3. MENTOR — Help the student understand their root learning patterns (both good and bad)
   so they can repeat what works and fix what doesn't.

SCORING RUBRIC (weighted criteria):
- Knowledge & Understanding (25%): Grasp of concepts, frameworks, terminology
- Critical Analysis (25%): Analytical depth, counter-arguments, evaluation vs description
- Application (20%): Use of case study, practical examples, real-world links
- Referencing & Academic Practice (15%): In-text/bibliography match, citation format, source quality
- Structure & Presentation (15%): Layout, formatting, headings, grammar

DUAL 5W1H ANALYSIS FRAMEWORK:

You must produce TWO chains for your findings:

POSITIVE CHAIN — For every strength you identify:
- WHAT: What the student did well (one sentence)
- WHERE: Exact location — question number, paragraph, or quoted text
- WHY (Why chain): Drill down into WHY this works and earns marks.
  Ask "why is this effective?" repeatedly (2-4 levels) until you reach
  a reusable pattern the student can consciously apply elsewhere.
  Format: "1. [surface win] → 2. [deeper reason] → 3. [reusable pattern]"
- HOW: How this strengthens the paper / which rubric criterion it serves
- WHO: Who notices this positively (marker, moderator, external examiner)

NEGATIVE CHAIN — For every issue you identify:
- WHAT: The specific issue (one sentence)
- WHERE: Exact location — question number, paragraph, or quoted text
- WHY (5 Whys root cause): Drill down from surface problem to root learning gap.
  Ask "why?" repeatedly (2-5 levels) until you reach something the student can
  act on. Stop at the actionable root — not every issue needs all 5 levels.
  Format: "1. [surface problem] → 2. [deeper] → 3. [root cause]"
- HOW: Concrete fix — what to do differently, with before/after example where applicable
- WHO: Who will notice this issue (marker, Turnitin, external moderator, peer reviewer)
- WHEN: Priority — critical (fix before submission), important (significant mark gain),
  polish (minor improvement)

Subject: {subject}
Assessment: {assessment_type}
Questions: {num_questions}

Instructions:
1. Score each criterion 0-100
2. Evaluate each question separately — strengths, weaknesses, suggestions
3. Cross-match every in-text citation against the bibliography. List matches and mismatches.
4. CROSS-QUESTION CONSISTENCY CHECK: Compare how the student uses sources and
   arguments across ALL questions. Flag any contradictions where:
   - The same author is cited to support opposing arguments in different questions
   - A concept is defined/applied differently across questions
   - The student's own position shifts between questions without acknowledgement
   - A framework is praised in one answer but its limitations ignored in another
   For each inconsistency found, note both locations (e.g. "Q1 para 3 vs Q3 para 2"),
   explain the contradiction clearly, and advise whether the sources genuinely conflict
   at the principle level but address different contexts (which is acceptable and shows
   nuance) or whether the student has misunderstood/misapplied the source (which costs marks).
5. Identify strengths using the POSITIVE 5W1H chain — help the student understand
   WHY their good work is good, so they can replicate the pattern deliberately
6. Identify issues using the NEGATIVE 5W1H + 5 Whys chain — drill to root learning gap
7. For top 5 weaknesses, provide before (actual quote from paper) and after (improved
   version) examples. Link each example back to the root cause it addresses.
8. Estimate overall grade percentage

Output strictly as JSON:
{
  "overall_score": number,
  "knowledge_score": number,
  "critical_score": number,
  "application_score": number,
  "referencing_score": number,
  "structure_score": number,
  "questions": [
    {
      "number": number,
      "score": number,
      "strengths": [string],
      "weaknesses": [string],
      "suggestions": [string]
    }
  ],
  "reference_audit": [
    {
      "citation": string,
      "source_type": "in_text" | "bibliography",
      "matched": boolean,
      "issue_type": "missing" | "unused" | "date_mismatch" | null
    }
  ],
  "strengths": [
    {
      "what": string,
      "where": string,
      "why_chain": [string],
      "reusable_pattern": string,
      "how_it_helps": string,
      "who_notices": string,
      "category": string
    }
  ],
  "issues": [
    {
      "what": string,
      "where": string,
      "why_chain": [string],
      "root_cause": string,
      "how": string,
      "who_notices": string,
      "when_priority": "critical" | "important" | "polish",
      "category": string
    }
  ],
  "cross_question_consistency": [
    {
      "location_a": string,
      "location_b": string,
      "description": string,
      "verdict": "genuine_nuance" | "misunderstanding" | "contradiction",
      "explanation": string,
      "recommendation": string
    }
  ],
  "examples": [
    {
      "title": string,
      "before": string,
      "after": string,
      "why_better": string,
      "root_cause_addressed": string
    }
  ]
}

User: {paper_text}
```

### Claude API — Mode B Addition (AI Detection)

Append to Mode A system prompt:
```
ADDITIONAL (Mode B — AI Detection):
6. Analyse the writing for AI-generated content indicators:
   - Uniform sentence length patterns
   - Lack of hedging language or personal voice
   - Generic phrasing without specific examples
   - Perfect grammar with no natural errors
   - Repetitive transition phrases
   - Overly structured/formulaic responses
7. Score AI risk 0-100 (0 = definitely human, 100 = definitely AI)
8. List specific indicators with quoted examples from the paper
9. Assess Turnitin readiness: READY / AT RISK / NOT READY

Add to JSON output:
{
  "ai_risk_score": number,
  "ai_indicators": [
    {
      "indicator": string,
      "evidence": string,
      "severity": "high" | "medium" | "low"
    }
  ],
  "turnitin_readiness": "READY" | "AT_RISK" | "NOT_READY",
  "turnitin_advice": [string]
}
```

---

## Workflow 5: Comparison

### Endpoint: `POST /papers/compare`
**Input:** `{ draft_eval_id, final_paper_id }`
**Steps:**
1. Get draft evaluation (scores, issues, examples)
2. Get final evaluation (scores, issues)
3. Calculate score diffs per criterion
4. Match issues: which fixed, which remaining, which new
5. **Anti-monkey detection:** For each before/after example in draft report, compute trigram Jaccard similarity against final paper text. Flag if >85% match on any suggestion.
6. Generate comparison HTML
7. Insert into `draft_final_comparisons` table
8. Return comparison data

### Trigram Anti-Monkey Algorithm:
```javascript
function trigrams(text) {
  const clean = text.toLowerCase().replace(/[^a-z\s]/g, '').trim();
  const words = clean.split(/\s+/);
  const result = new Set();
  for (let i = 0; i <= words.length - 3; i++) {
    result.add(words.slice(i, i + 3).join(' '));
  }
  return result;
}

function jaccardSimilarity(setA, setB) {
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

// Flag if any suggestion is >85% similar to final text
const MONKEY_THRESHOLD = 0.85;
```

---

## Workflow 6: Status

### Endpoint: `GET /evaluations/:id/status`
**Steps:**
1. Query `evaluations` by ID
2. If `report_html` is not null → status = `complete`
3. If record exists but no report → status = `processing`
4. Return `{ id, status, progress }`

---

## Workflow 7: Reports

### Endpoint: `GET /evaluations/:id/report`
**Steps:**
1. Query `evaluations` by ID, include `report_html`
2. Return `{ report_html }`

### Endpoint: `GET /evaluations/:id/download`
**Steps:**
1. Query `evaluations` by ID
2. Set headers: `Content-Type: text/html`, `Content-Disposition: attachment; filename=BeeGraded-Report-{id}.html`
3. Return `report_html` as file download

---

## Workflow 8: Dashboard

### Endpoint: `GET /user/papers`
**Steps:**
1. Get user_id from JWT
2. Query `papers` WHERE `user_id = ?` ORDER BY `uploaded_at DESC`
3. For each paper, include `evaluations` (JOIN)
4. Return array of papers with nested evaluations

### Endpoint: `GET /user/evaluations`
**Steps:**
1. Get user_id from JWT
2. Query `evaluations` JOIN `papers` WHERE `papers.user_id = ?`
3. Return array of evaluations

---

## Environment Variables (n8n Credentials)

```
PAYFAST_MERCHANT_ID=10000100
PAYFAST_MERCHANT_KEY=46f0cd694581a
PAYFAST_PASSPHRASE=jt7NOE43FZPn
PAYFAST_URL=https://sandbox.payfast.co.za/eng/process
PAYFAST_VALIDATE_URL=https://sandbox.payfast.co.za/eng/query/validate
FRONTEND_URL=http://localhost:8090
CLAUDE_API_KEY=sk-ant-...
DB_CONNECTION_STRING=postgresql://user:pass@localhost:5432/beegraded
SMTP_HOST=...
SMTP_USER=...
SMTP_PASS=...
```

---

## Report HTML Template

The report HTML template should match the style from `CANDIDATES/Evaluation-Report-Kambule-143474-Combined.html`:
- Self-contained (all CSS inline)
- Cover page with gradient, student details, scores
- Anchored TOC with Part A and Part B sections
- Colour-coded score gauges
- Before/after example boxes
- Reference audit table
- Prioritised fix list
- Print-friendly CSS
- Mobile responsive

Template variables are populated from the evaluation JSON response.
