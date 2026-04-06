# Project Status — LLM Top 10 Security Lab

*Last updated: 2026-04-06 (Session 1, continued)*

---------------------------------------------------------------------

## Current Phase

**Core backend implemented. Attack testing and frontend next.**

---------------------------------------------------------------------

## Spec Status

| Spec | Status |
|------|--------|
| `llm01a_direct_prompt_injection.md` | ✅ Written |
| `llm01b_indirect_prompt_injection.md` | ✅ Written |
| `llm02_sensitive_information_disclosure.md` | ✅ Written |
| `llm03_supply_chain.md` | ✅ Written |
| `llm04_data_and_model_poisoning.md` | ✅ Written |
| `llm05_improper_output_handling.md` | ✅ Written |
| `llm06_excessive_agency.md` | ✅ Written |
| `llm07_system_prompt_leakage.md` | ✅ Written |
| `llm08_vector_and_embedding_weaknesses.md` | ✅ Written |
| `llm09_misinformation.md` | ✅ Written |
| `api_spec.md` | ✅ Written |
| `frontend_spec.md` | ✅ Written |
| `defense_spec.md` | ✅ Written |
| `deployment_spec.md` | ✅ Written |

---------------------------------------------------------------------

## Implementation Status

| Component | File(s) | Status |
|-----------|---------|--------|
| ATTACKS dict + build_messages + check_success | `app.py` | ✅ Done |
| FastAPI routes (/api/attack, /api/attacks, /api/custom) | `app.py` | ✅ Done |
| Scorecard route (sync, SSE pending) | `app.py` | 🔧 Partial |
| Defense route (/api/defend) | `app.py` | ⬜ Not started |
| Meta Prompt Guard 2 integration | `scanner.py` | ⬜ Not started |
| LLM Guard output scanner integration | `scanner.py` | ⬜ Not started |
| LLM Guard context scanner integration | `scanner.py` | ⬜ Not started |
| System prompt hardening logic | `scanner.py` | ⬜ Not started |
| Guardrail model logic | `scanner.py` | ⬜ Not started |
| HTML template | `templates/index.html` | 🔧 Placeholder |
| CSS dark theme | `static/css/styles.css` | ⬜ Not started |
| JS app logic (sidebar, forms, results) | `static/js/app.js` | ⬜ Not started |
| JS i18n (EN/ES) | `static/js/i18n.js` | ⬜ Not started |
| Docker deployment | `Dockerfile` | ✅ Written |
| Requirements | `requirements.txt` | ✅ Written |

---------------------------------------------------------------------

## Open Issues

None yet.

---------------------------------------------------------------------

## Attack Verification (against LLaMA 3.3 70B)

| Attack | Tested? | Works? | Notes |
|--------|---------|--------|-------|
| LLM01a Direct Injection | ⬜ | — | |
| LLM01b Indirect Injection | ⬜ | — | |
| LLM02 Sensitive Info Disclosure | ⬜ | — | |
| LLM03 Supply Chain | ⬜ | — | |
| LLM04 Data Poisoning | ⬜ | — | |
| LLM05 Improper Output | ⬜ | — | |
| LLM06 Excessive Agency | ⬜ | — | |
| LLM07 System Prompt Leakage | ⬜ | — | |
| LLM08 Vector/Embedding | ⬜ | — | |
| LLM09 Misinformation | ⬜ | — | |

---------------------------------------------------------------------

## Defense Verification

| Defense Tool | Integrated? | Tested? | Notes |
|--------------|-------------|---------|-------|
| Meta Prompt Guard 2 | ⬜ | — | |
| LLM Guard — Output | ⬜ | — | |
| LLM Guard — Context | ⬜ | — | |
| System Prompt Hardening | ⬜ | — | |
| Guardrail Model | ⬜ | — | |

---------------------------------------------------------------------

## Next Recommended Task

**Step 2:** Test each attack against LLaMA 3.3 70B via Groq to verify they actually work. Update the attack verification table. File GitHub issues for any attacks that need prompt tuning.

Alternative: proceed to Phase 2 (frontend) and test attacks through the UI.

---------------------------------------------------------------------

## Session Notes

### Session 1 — 2026-04-06

**What was accomplished:**

1. Created `/Users/niko/Documents/llm-top-10-demo/` directory
2. Browsed OWASP LLM Top 10 (genai.owasp.org) — extracted all 10 vulnerability details from individual pages
3. Researched other AI security frameworks — identified OWASP Agentic AI Top Threats as candidate for Part 3
4. Wrote 10 attack spec files with full detail: exact system prompts, user prompts, context documents, success check strings, expected model output, Cause/Effect/Impact display text, defense notes
5. Wrote 4 infrastructure specs: API (FastAPI endpoints + schemas), frontend (dark UI + sidebar + result panels), defense (5 toggleable tools + effectiveness matrix), deployment (Docker + HF Spaces)
6. Researched real defense tools — selected Meta Prompt Guard 2, LLM Guard (Protect AI), plus custom prompt hardening and guardrail model
7. Created repo scaffolding: .gitignore, Dockerfile, requirements.txt, LICENSE, README.md (with HF Spaces frontmatter), directory structure
8. Created GitHub repo: github.com/nbehar/llm-top-10-demo (public)
9. Wrote CLAUDE.md adapted from digistore reference — includes: spec-first workflow, language/library rules, security caveats, HF Spaces constraints, error handling, accessibility, mandatory issue tracking, project status tracking
10. Created docs/project-status.md for cross-session tracking

**Key decisions made:**

- **Frontend:** FastAPI + custom HTML/CSS/JS (not Gradio) — clean modern dark theme, sidebar navigation
- **Model:** LLaMA 3.3 70B via Groq (same as MCP demo)
- **Defense tools:** 3 real (Prompt Guard 2, LLM Guard output, LLM Guard context) + 2 custom (prompt hardening, guardrail model)
- **Excluded:** LLM10 Unbounded Consumption (not demoable interactively)
- **Scenario:** NexaCore Technologies (same as MCP demo)
- **Workshop series:** Part 1 (LLM Top 10), Part 2 (MCP Top 10), Part 3 future (Agentic AI)
- **Language:** EN/ES toggle kept
- **Branding:** "Workshop by Nikolas Behar" (not OWASP San Diego specific)

**What's next:**

Start implementation — Step 1 from the implementation sequence: `app.py` with ATTACKS dict, `build_messages()`, `check_success()`, `generate_response()`, and core API routes.
