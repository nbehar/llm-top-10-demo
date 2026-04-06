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

Full schemas in `specs/api_spec.md`.

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

---------------------------------------------------------------------

# Default Startup Behavior

On session start Claude MUST:

1. Read CLAUDE.md
2. Read all specs
3. Check what's implemented (app.py, scanner.py, static/, templates/)
4. Identify gaps between specs and implementation
5. Propose next task with specific files and changes
6. Wait for approval before coding

---------------------------------------------------------------------

# Engineering Principle

llm-top-10-demo is an **educational security tool**, not a prototype.

Every attack scenario is carefully designed to teach a specific OWASP vulnerability.

Every defense tool is a real (or production-pattern) security control participants can use at work.

The workshop must be:
- **Accurate** — attacks must actually work against the model
- **Educational** — Cause/Effect/Impact must clearly explain what happened and why
- **Actionable** — defense tools are real, named, and installable
