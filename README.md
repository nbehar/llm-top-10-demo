---
title: LLM Top 10 Security Lab
emoji: 🔓
colorFrom: gray
colorTo: red
sdk: docker
app_port: 7860
pinned: false
---

# LLM Top 10 Security Lab — NexaCore Technologies

Interactive workshop for the [OWASP Top 10 for LLM Applications (2025)](https://genai.owasp.org/llm-top-10/).

Participants run 9 real attacks against a live LLM (LLaMA 3.3 70B via Groq) and learn to defend against each one using real open-source security tools.

## Attacks Covered

| # | Vulnerability | Attack Scenario |
|---|---|---|
| LLM01 | Prompt Injection | Direct override + indirect via poisoned RAG document |
| LLM02 | Sensitive Info Disclosure | Social engineering extracts credentials from system prompt |
| LLM03 | Supply Chain | Compromised model recommends malicious packages |
| LLM04 | Data & Model Poisoning | Poisoned knowledge base delivers dangerous security advice |
| LLM05 | Improper Output Handling | Model generates XSS-vulnerable code |
| LLM06 | Excessive Agency | Overpowered tools + vague request = destructive actions |
| LLM07 | System Prompt Leakage | Extraction techniques reveal confidential business rules |
| LLM08 | Vector & Embedding Weaknesses | Poisoned document in vector DB spreads disinformation |
| LLM09 | Misinformation | Model fabricates packages, court rulings, and APIs |

## Defense Tools

| Tool | Type | What It Does |
|------|------|-------------|
| Meta Prompt Guard 2 | Input scanner (86M model) | Detects injection/jailbreak in user prompts |
| LLM Guard — Output | Output scanner (Protect AI) | Detects leaked credentials, PII, dangerous code |
| LLM Guard — Context | Context scanner (Protect AI) | Scans RAG documents for hidden instructions |
| System Prompt Hardening | Prompt engineering | Boundary tags + reinforcement rules |
| Guardrail Model | Second LLM check | Independent model evaluates response for violations |

## Stack

- **Backend:** FastAPI + Uvicorn
- **Frontend:** Custom HTML/CSS/JS (dark theme, sidebar navigation)
- **Model:** LLaMA 3.3 70B via [Groq](https://groq.com)
- **Defense:** [Meta Prompt Guard 2](https://huggingface.co/meta-llama/Prompt-Guard-86M), [LLM Guard](https://github.com/protectai/llm-guard)
- **Deploy:** HuggingFace Spaces (Docker)

## Local Development

```bash
# Clone
git clone https://github.com/nbehar/llm-top-10-demo.git
cd llm-top-10-demo

# Install dependencies
pip install -r requirements.txt

# Set API key
export GROQ_API_KEY=your_key_here

# Run
uvicorn app:app --host 0.0.0.0 --port 7860 --reload
```

## Workshop by Nikolas Behar

For educational purposes only.
