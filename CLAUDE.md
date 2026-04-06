# CLAUDE.md — llm-top-10-demo

---------------------------------------------------------------------

# Project Purpose

llm-top-10-demo is an **interactive security workshop platform** for the OWASP LLM Top 10.

The system allows participants to:

- Run 9 real attacks (11 sub-scenarios) against a live LLM
- Toggle 5 defense tools to see what catches each attack
- Write custom prompts and injection payloads
- Score all attacks at once and see hit rates

This is Part 1 of a workshop series by Nikolas Behar:
- **Part 1:** OWASP LLM Top 10 (this repo)
- **Part 2:** OWASP MCP Top 10 (mcp-injection-demo)
- **Part 3:** OWASP Agentic AI Top Threats (future)

The repository — not conversation history — is the system of record.

---------------------------------------------------------------------

# Repository Structure

```
app.py              FastAPI application (routes, ATTACKS dict, model calls)
scanner.py          Defense tools integration (Prompt Guard, LLM Guard, guardrail)
static/css/         Stylesheets
static/js/          Client-side app logic and i18n
templates/          Jinja2 HTML templates
specs/              Feature and attack specifications
postman/            Postman collection (API testing contract)
docs/               Project status and session tracking
```

---------------------------------------------------------------------

# Core Architecture

## Stack

- **Backend:** FastAPI + Uvicorn (Python)
- **Frontend:** Custom HTML/CSS/JS (no framework)
- **Model:** LLaMA 3.3 70B via Groq API
- **Defense tools:** Meta Prompt Guard 2, LLM Guard (Protect AI), custom guardrail model
- **Deploy:** Docker on HuggingFace Spaces

## Backend Responsibilities

- ATTACKS dict: all attack scenarios, prompts, success criteria
- Message construction: system prompt + context + user prompt per attack
- Groq API calls: model inference
- Success detection: canary, secret detection, pattern matching, hallucination check
- Defense pipeline: input/output/context scanning, prompt hardening, guardrail model
- SSE streaming for scorecard progress

## Frontend Responsibilities

- Sidebar navigation: attack list + mode selector
- Attack form: user prompt, canary phrase, run button
- Result panels: Cause / Effect / Impact (vertical scroll)
- Defense toggles: 5 selectable defense tools
- Language toggle: EN/ES
- Scorecard: progress bar + results table

Frontend is API-driven. No business logic in JS.

---------------------------------------------------------------------

# Language & Library Rules

## Python (Backend)

- Python 3.11+
- Type hints on all function signatures
- Pydantic models for API request/response schemas
- `async def` for all FastAPI route handlers
- Groq SDK: use `groq.Groq` client, NOT raw HTTP
- No `print()` for logging — use `logging` module
- f-strings preferred over `.format()` for non-spec text
- Spec text (system prompts, injections) uses `.format()` with `{canary}` placeholder

## JavaScript (Frontend)

- Vanilla ES6+ — no build step, no bundler, no npm
- No jQuery, no React, no framework
- `fetch()` for all API calls with proper error handling
- `async/await` over `.then()` chains
- CSS custom properties for theming (not hardcoded colors in JS)
- `<script type="module">` for imports between JS files
- No inline `onclick` — use `addEventListener`

## CSS

- Single `styles.css` file
- CSS custom properties for all colors (defined in `:root`)
- Mobile-first responsive design
- No CSS frameworks (no Tailwind, no Bootstrap)
- BEM-like class naming: `.attack-card`, `.attack-card__title`, `.attack-card--active`
- Dark theme is the only theme — no light mode toggle

## Libraries (pinned in requirements.txt)

| Library | Purpose | Notes |
|---------|---------|-------|
| `fastapi` | Web framework | Async routes, Pydantic validation |
| `uvicorn` | ASGI server | Production server |
| `groq` | Groq API client | LLaMA inference |
| `jinja2` | Templates | Server-side HTML rendering |
| `sse-starlette` | SSE support | Scorecard streaming |
| `llm-guard` | Defense scanner | Output + context scanning |
| `transformers` | ML models | Meta Prompt Guard 2 |
| `torch` | ML runtime | Required by transformers |

Do NOT add libraries without updating requirements.txt and this section.

---------------------------------------------------------------------

# Security Considerations

## This App is Intentionally Vulnerable

This is a **security education tool**. The attacks are designed to succeed. Do NOT:
- Add safety filters that prevent attacks from working
- Harden the model calls in ways that break the demos
- Add authentication to the workshop (it's meant to be open)

## What IS Sensitive

- `GROQ_API_KEY` — never commit, never log, never expose in frontend
- System prompts contain fictional but realistic credentials — always label as `FOR EDUCATIONAL PURPOSES`
- The Groq API has rate limits — implement client-side throttling to prevent abuse

## What is NOT Sensitive

- NexaCore data is entirely fictional — no real credentials, no real people
- Attack payloads are educational — they demonstrate known techniques, not zero-days
- The app is public on HuggingFace Spaces — assume all traffic is untrusted

## API Safety

- Rate limit all endpoints (max 10 req/min per IP for attack endpoints)
- Validate all inputs with Pydantic — reject malformed requests
- Set `max_tokens=1024` on all Groq calls — prevent unbounded consumption
- Timeout Groq calls at 30 seconds
- Never pass user input to `eval()`, `exec()`, or shell commands
- Never render model output as raw HTML in the frontend — always escape/sanitize

---------------------------------------------------------------------

# Hosting Constraints (HuggingFace Spaces)

## Resource Limits

- CPU-only (free tier) or basic GPU
- 16GB RAM typical, 2 vCPU
- Cold start: ~30-60 seconds (Docker build + model download)
- Ephemeral disk — no persistent storage between restarts
- Port 7860 required

## Implications

- Meta Prompt Guard 2 (86M params) must fit in CPU memory (~350MB)
- LLM Guard models download on first use — handle gracefully with fallback
- No database — all state is in-memory per session
- No user accounts — workshop is anonymous
- If Space sleeps (idle timeout), next request triggers cold start

## Environment Variables

| Variable | Required | Set via |
|----------|----------|---------|
| `GROQ_API_KEY` | Yes | HF Space secret |

No other secrets required. Defense tools use public models.

---------------------------------------------------------------------

# Error Handling

## Backend

- All route handlers wrapped in try/except
- Groq API errors: return structured JSON with error type and message
- Scanner errors (model download failure, etc.): degrade gracefully — skip that defense, don't crash
- Never expose stack traces to the frontend in production

## Frontend

- Show loading spinner during API calls
- Show user-friendly error message on failure (not raw JSON)
- Timeout after 45 seconds with "The model is taking too long" message
- Retry logic: none — let the user click "Run" again manually

---------------------------------------------------------------------

# Engineering Philosophy

**Spec-Driven Development**

Principles:

- Attack scenarios defined in specs before implementation
- Each attack has exact system prompts, user prompts, and success criteria
- Cause/Effect/Impact display text written before code
- Defense effectiveness matrix verified against specs
- If code disagrees with spec → code is wrong

---------------------------------------------------------------------

# Spec-First Development

## Rules

1. Every attack begins with a spec in `/specs`.
2. Specs describe the exact scenario, prompts, and expected behavior.
3. Specs contain the literal text used in system prompts and injections.
4. Implementation exists only to satisfy the spec's success criteria.
5. New attacks require a spec before any code.

## Attack Spec Format

Each attack spec MUST include:

### OWASP Reference
ID, name, sub-type.

### Scenario
NexaCore Technologies context for this attack.

### Attack Mechanism
`system_user` or `context_injection`.

### System Prompt
Exact text (with `{canary}` placeholder if applicable).

### Context Documents
For RAG-based attacks. Exact text of each document.

### Default User Prompt
Exact text of the attack prompt.

### Success Criteria
Type (`canary`, `contains_secret`, `contains_dangerous_output`, `action_taken`, `hallucination_check`) and exact check strings.

### Expected Model Output
Approximate expected response from LLaMA.

### Cause / Effect / Impact Display
Exact text for each panel shown to participants.

### Defense Notes
Which defense tools are effective and why.

---------------------------------------------------------------------

# Infrastructure Specs

Located in `/specs/`:

- `api_spec.md` — FastAPI endpoints, request/response schemas
- `frontend_spec.md` — UI layout, components, colors, interactions
- `defense_spec.md` — 5 defense tools, effectiveness matrix, integration details
- `deployment_spec.md` — Dockerfile, HF Spaces config, environment variables

---------------------------------------------------------------------

# The 9 Attacks (11 sub-scenarios)

| ID | Spec File | OWASP | Detection |
|----|-----------|-------|-----------|
| llm01a | `llm01a_direct_prompt_injection.md` | LLM01 | canary |
| llm01b | `llm01b_indirect_prompt_injection.md` | LLM01 | canary |
| llm02 | `llm02_sensitive_information_disclosure.md` | LLM02 | secret strings |
| llm03 | `llm03_supply_chain.md` | LLM03 | canary |
| llm04 | `llm04_data_and_model_poisoning.md` | LLM04 | canary |
| llm05 | `llm05_improper_output_handling.md` | LLM05 | dangerous output patterns |
| llm06 | `llm06_excessive_agency.md` | LLM06 | action patterns |
| llm07 | `llm07_system_prompt_leakage.md` | LLM07 | secret strings |
| llm08 | `llm08_vector_and_embedding_weaknesses.md` | LLM08 | canary |
| llm09 | `llm09_misinformation.md` | LLM09 | hallucination patterns |

---------------------------------------------------------------------

# The 5 Defense Tools

| # | Tool | Type | Integration |
|---|------|------|-------------|
| 1 | Meta Prompt Guard 2 | Input scanner | `transformers` — 86M param classifier |
| 2 | LLM Guard — Output | Output scanner | `llm-guard` — credential/PII/code detection |
| 3 | LLM Guard — Context | Context scanner | `llm-guard` — RAG document scanning |
| 4 | System Prompt Hardening | Prompt engineering | Custom — boundary tags + refusal rules |
| 5 | Guardrail Model | Second LLM check | Custom — Groq API call with evaluator prompt |

Defense effectiveness matrix is in `specs/defense_spec.md`.

No single defense covers all attacks. This is the core lesson.

---------------------------------------------------------------------

# Key Functions

## `build_messages(attack, user_prompt, canary)`

Constructs the `messages` array for the Groq API call. Handles both `system_user` and `context_injection` attack mechanisms. Context documents are appended to the system message when present.

## `check_success(response, attack)`

Unified success detection. Routes to the correct check based on `attack["success_criteria"]`:
- `canary` → case-insensitive substring search
- `contains_secret` → check against `success_check_strings`
- `contains_dangerous_output` → pattern matching for XSS/SQLi
- `action_taken` → check for destructive tool call patterns
- `hallucination_check` → check for fabricated content patterns

## `generate_response(messages)`

Calls Groq API with `llama-3.3-70b-versatile`, `temperature=0.7`, `max_tokens=1024`.

---------------------------------------------------------------------

# API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/` | Serve the single-page app |
| GET | `/api/attacks` | List all available attacks |
| POST | `/api/attack` | Run a single attack |
| POST | `/api/defend` | Run attack with selected defenses |
| POST | `/api/custom` | Run custom system/context/user prompt |
| POST | `/api/scorecard` | Run all attacks |
| GET | `/api/scorecard/stream` | SSE endpoint for scorecard progress |
| GET | `/health` | Health check (API key status, attack count) |

Full schemas in `specs/api_spec.md`.

## Postman Collection (MANDATORY)

Location: `postman/llm-top-10-lab.postman_collection.json`

The Postman collection is the **API testing contract**. It contains a request for every endpoint with example payloads, expected behavior descriptions, and shared variables.

**Update rules:**

- When a new API endpoint is added → add a corresponding Postman request
- When request/response schema changes → update the Postman request body and description
- When a new attack is added → add a Postman request for it in the correct OWASP folder
- When an endpoint is removed → remove the Postman request
- When success_check_strings change → update the Postman request description

The collection uses variables:
- `{{base_url}}` — default `http://localhost:7860`
- `{{canary}}` — default `BANANA SUNDAE`

Claude MUST keep the Postman collection in sync with `app.py` routes. A route without a Postman request is untestable. A Postman request pointing to a nonexistent route is broken.

---------------------------------------------------------------------

# Claude Operating Modes

## Plan Mode (DEFAULT)

Allowed:
- reading specs
- reasoning about architecture
- investigating bugs
- analyzing attack scenarios

NOT allowed:
- writing production code
- modifying files

Claude MUST output:

### Spec Understanding
### Implementation Plan
### Files to Modify

Claude MUST WAIT for approval.

---

## Build Mode

Entered ONLY after explicit approval.

Allowed:
- implementing against specs
- creating new files per spec
- modifying existing files

Build scope limited to approved plan.

---------------------------------------------------------------------

# Session Recovery Protocol

Claude sessions are stateless.

On startup Claude MUST:

1. Read CLAUDE.md
2. Scan `/specs` for attack and infrastructure specs
3. Inspect `app.py`, `scanner.py`, `templates/`, `static/`
4. Review recent commits
5. Detect what's implemented vs what's still in specs only
6. Propose next implementation task

Repository state is Claude's memory.

---------------------------------------------------------------------

# NexaCore Scenario Rules

All attacks use the **NexaCore Technologies** scenario:

- ~800-person software company
- 9 different internal tools/systems
- Each attack targets a different NexaCore system
- System prompts reference NexaCore employees, policies, and infrastructure
- Confidential data (CEO salary, acquisition targets, credentials) is fictional but realistic

Claude MUST NOT:
- invent new NexaCore context not in specs
- change system prompts without updating the corresponding spec
- add attacks without a spec file

---------------------------------------------------------------------

# Anti-Hallucination Rules

Claude MUST NOT:
- fabricate attack scenarios not in specs
- assume Groq API behavior without testing
- claim a defense tool catches an attack without verifying against the effectiveness matrix
- modify success_check_strings without re-testing against actual model output

If uncertain about model behavior → test with Groq API first.

---------------------------------------------------------------------

# Frontend Rules

- Dark theme (`#0a0a0b` background, `#141416` surfaces)
- Sidebar (260px) + main panel layout
- No frontend frameworks (vanilla HTML/CSS/JS)
- All API calls via `fetch()`
- State managed in JS objects, not in DOM
- EN/ES translations in `static/js/i18n.js`
- Mobile responsive: sidebar collapses below 768px

Visual spec in `specs/frontend_spec.md`.

## Cause / Effect / Impact Rendering

The API returns structured JSON for each section. The frontend renders them as cards:

- **Cause card:** neutral dark code blocks for legitimate data, red left-border blockquote for injections/attacks
- **Effect card:** model output with canary/secrets highlighted in red inline badges
- **Impact card:** green header for BLOCKED, red header for SUCCEEDED, consequence text below

Code blocks in Cause panel: use `<pre><code>` with syntax highlighting (no library — just CSS)
Injection callouts: red left border (`#ef4444`), red-tinted background (`rgba(239,68,68,0.06)`)
Model output: escape all HTML before rendering — never use `innerHTML` with model text

## Accessibility

- All interactive elements keyboard-navigable
- Sidebar items focusable with Enter/Space to select
- ARIA labels on icon-only buttons
- Color is never the ONLY indicator — use icons (✅/🚨) alongside green/red
- Font sizes minimum 14px body, 12px captions
- Sufficient contrast ratio (4.5:1 minimum) on all text

---------------------------------------------------------------------

# Defense Integration Rules

- Defense tools are toggled independently by the participant
- Each defense reports its own verdict (pass/fail/skip)
- Defenses run in order: input → context → (model call) → output → guardrail
- If any defense blocks, the model may be called with sanitized input instead
- Scanner results shown individually so participants understand which layer caught what
- The guardrail model doubles API calls — display this cost trade-off in the UI

---------------------------------------------------------------------

# Deployment

- Docker on HuggingFace Spaces
- `GROQ_API_KEY` as HF Space secret
- Port 7860
- Static files served via FastAPI `StaticFiles` mount
- Templates rendered via Jinja2

---------------------------------------------------------------------

# Testing Protocol

Before deploying, verify:

1. Each of 11 attacks produces correct Cause/Effect/Impact
2. Each defense tool detects what it should (per effectiveness matrix in `specs/defense_spec.md`)
3. Defense toggles work independently and in combination
4. Scorecard runs all attacks with real-time progress
5. EN/ES toggle switches all UI text
6. Custom Prompt mode works with arbitrary inputs
7. Mobile layout: sidebar collapses, panels stack

Successful API response ≠ successful feature.

Attack must actually succeed against the model for the demo to work.

---------------------------------------------------------------------

# Git & GitHub

- Repo: `github.com/nbehar/llm-top-10-demo`
- Branch: `main`
- HF Spaces deployment: push to HF remote
- Commit messages describe what changed and why
- Specs committed before implementation code

## Issue Tracking (MANDATORY)

Claude MUST create a GitHub issue when:

- An attack fails to work against the model (spec says it should succeed)
- A defense tool doesn't detect what the effectiveness matrix says it should
- A spec is ambiguous or contradicts another spec
- A library/dependency has a breaking change or compatibility issue
- Model behavior changes between runs (non-deterministic failure)
- HF Spaces deployment fails or behaves differently than local
- Frontend rendering breaks on mobile or specific browsers
- Any blocker that prevents completing the current task

Issues MUST include:

```
**Spec reference:** which spec file this relates to
**Problem:** what went wrong
**Expected:** what should have happened (per spec)
**Actual:** what actually happened
**Evidence:** error messages, model output, screenshots (no secrets)
**Reproduction:** steps to trigger the issue
**Severity:** blocker / bug / enhancement
```

Use `gh issue create` via CLI. Apply labels: `bug`, `blocker`, `spec-mismatch`, `model-behavior`, `defense-tool`, `frontend`, `deployment`.

Claude MUST NOT silently work around a problem. If it's worth a workaround, it's worth an issue.

---------------------------------------------------------------------

# Project Status Tracking (MANDATORY)

Claude maintains: `docs/project-status.md`

This file is Claude's cross-session memory. It MUST be updated:

- **At the start of each session:** read it to pick up where the last session left off
- **After completing a task:** mark the component as done, update verification tables
- **After testing an attack:** record whether it worked, any tuning needed
- **After integrating a defense tool:** record whether it detects what it should
- **After hitting a blocker:** note the issue number and workaround (if any)
- **At the end of a session:** update "Session Notes" with what was done and what's next

The file contains:

- **Spec Status:** which specs are written
- **Implementation Status:** which components are built (⬜/🔧/✅)
- **Open Issues:** links to GitHub issues
- **Attack Verification:** does each attack actually work against LLaMA?
- **Defense Verification:** does each defense tool catch what it should?
- **Next Recommended Task:** what to do next
- **Session Notes:** per-session log of decisions and progress

If `project-status.md` doesn't exist → create it from the template.

If it exists but is stale → update it before proposing work.

---------------------------------------------------------------------

# Default Startup Behavior

On session start Claude MUST:

1. Read CLAUDE.md
2. Read `docs/project-status.md`
3. Read all specs
4. Check what's implemented (app.py, scanner.py, static/, templates/)
5. Cross-reference implementation against project-status.md
6. Update project-status.md if stale
7. Propose next task based on "Next Recommended Task"
8. Wait for approval before coding

---------------------------------------------------------------------

# Engineering Principle

llm-top-10-demo is an **educational security tool**, not a prototype.

Every attack scenario is carefully designed to teach a specific OWASP vulnerability.

Every defense tool is a real (or production-pattern) security control participants can use at work.

The workshop must be:
- **Accurate** — attacks must actually work against the model
- **Educational** — Cause/Effect/Impact must clearly explain what happened and why
- **Actionable** — defense tools are real, named, and installable
