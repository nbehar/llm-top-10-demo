# Project Status — LLM Top 10 Security Lab

*Last updated: 2026-04-06*

---------------------------------------------------------------------

## Current Phase

**Specs complete. Implementation not started.**

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
| ATTACKS dict + build_messages + check_success | `app.py` | ⬜ Not started |
| FastAPI routes (/api/attack, /api/attacks, /api/custom) | `app.py` | ⬜ Not started |
| Scorecard route + SSE streaming | `app.py` | ⬜ Not started |
| Defense route (/api/defend) | `app.py` | ⬜ Not started |
| Meta Prompt Guard 2 integration | `scanner.py` | ⬜ Not started |
| LLM Guard output scanner integration | `scanner.py` | ⬜ Not started |
| LLM Guard context scanner integration | `scanner.py` | ⬜ Not started |
| System prompt hardening logic | `scanner.py` | ⬜ Not started |
| Guardrail model logic | `scanner.py` | ⬜ Not started |
| HTML template | `templates/index.html` | ⬜ Not started |
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

**Step 1:** Implement `app.py` — ATTACKS dict with all 11 scenarios, `build_messages()`, `check_success()`, `generate_response()`, and the `/api/attack` + `/api/attacks` routes. This is the core backend that everything else depends on.

---------------------------------------------------------------------

## Session Notes

*(Claude updates this section each session with what was accomplished and any decisions made)*
