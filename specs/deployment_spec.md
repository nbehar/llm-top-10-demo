# Deployment Spec — LLM Top 10 Workshop

## HuggingFace Spaces Configuration

**SDK:** Docker (not Gradio/Streamlit)
**Port:** 7860 (HF Spaces default)

---

## Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 7860

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
```

---

## requirements.txt

```
fastapi>=0.115.0
uvicorn[standard]>=0.32.0
groq>=0.12.0
jinja2>=3.1.0
python-multipart>=0.0.12
sse-starlette>=2.0.0
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | yes | Groq API key for LLaMA inference |

Set as HuggingFace Space secret.

---

## File Structure

```
llm-top-10-demo/
├── app.py                    # FastAPI app (routes, ATTACKS dict, model calls)
├── scanner.py                # Defense scanner (input/output/context scanning)
├── Dockerfile
├── requirements.txt
├── README.md
├── static/
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── app.js
│       └── i18n.js
├── templates/
│   └── index.html
└── specs/                    # Design specs (not deployed)
    ├── llm01a_direct_prompt_injection.md
    ├── ...
    ├── api_spec.md
    ├── frontend_spec.md
    └── deployment_spec.md
```

---

## HuggingFace Space Metadata

File: `README.md` (frontmatter)

```yaml
---
title: LLM Top 10 Security Lab
emoji: 🔓
colorFrom: gray
colorTo: red
sdk: docker
app_port: 7860
pinned: false
---
```
