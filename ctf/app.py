"""
BSides Colombia 2026 CTF de IA — Backend FastAPI
"""

import logging
import os
import re
import time
from collections import defaultdict
from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from groq import Groq
from pydantic import BaseModel, field_validator

from attacks import RETOS, RETOS_BY_ID
import leaderboard

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

CTF_END = datetime(2026, 4, 25, 22, 0, 0, tzinfo=ZoneInfo("America/Bogota"))

app = FastAPI(title="BSides Colombia 2026 CTF de IA", docs_url=None, redoc_url=None)
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY", ""))

# In-memory rate limiting
_rate_limit: dict[str, list[float]] = defaultdict(list)
ATTACK_LIMIT = 20   # requests per minute per IP
FLAG_LIMIT = 10     # submissions per minute per IP


def _check_rate_limit(ip: str, bucket: str, limit: int) -> bool:
    key = f"{bucket}:{ip}"
    now = time.time()
    window = [t for t in _rate_limit[key] if now - t < 60]
    _rate_limit[key] = window
    if len(window) >= limit:
        return False
    _rate_limit[key].append(now)
    return True


def _ctf_activo() -> bool:
    return datetime.now(tz=ZoneInfo("America/Bogota")) < CTF_END


def _tiempo_restante() -> int:
    delta = CTF_END - datetime.now(tz=ZoneInfo("America/Bogota"))
    return max(0, int(delta.total_seconds()))


def _build_messages(reto: dict, user_prompt: str) -> list[dict]:
    system_content = reto["system_prompt"]

    if reto.get("tipo") == "context_injection" and reto.get("context_documents"):
        docs_text = "\n\nDOCUMENTOS RECUPERADOS:\n"
        for doc in reto["context_documents"]:
            docs_text += f"\n[{doc['titulo']}]\n{doc['contenido']}\n"
        system_content = system_content + docs_text

    return [
        {"role": "system", "content": system_content},
        {"role": "user", "content": user_prompt},
    ]


async def _llamar_groq(messages: list[dict]) -> str:
    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.7,
            max_tokens=512,
            timeout=30,
        )
        return response.choices[0].message.content or ""
    except Exception as e:
        logger.error("Error Groq API: %s", e)
        raise HTTPException(status_code=503, detail="Error al conectar con el modelo de lenguaje.")


@app.on_event("startup")
async def startup():
    await leaderboard.init_db()
    logger.info("CTF iniciado. Fin: %s", CTF_END.isoformat())


# ── Request models ───────────────────────────────────────────────────────────

class AtaqueRequest(BaseModel):
    challenge_id: str
    user_prompt: str

    @field_validator("user_prompt")
    @classmethod
    def prompt_no_vacio(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("El prompt no puede estar vacío.")
        if len(v) > 2000:
            raise ValueError("El prompt no puede superar los 2000 caracteres.")
        return v


class BanderaRequest(BaseModel):
    apodo: str
    token: str
    challenge_id: str
    bandera: str

    @field_validator("bandera")
    @classmethod
    def bandera_formato(cls, v: str) -> str:
        return v.strip()


class ParticipanteRequest(BaseModel):
    apodo: str

    @field_validator("apodo")
    @classmethod
    def apodo_valido(cls, v: str) -> str:
        v = v.strip()
        if not re.match(r"^[A-Za-z0-9_áéíóúÁÉÍÓÚñÑ]{3,20}$", v):
            raise ValueError(
                "El apodo debe tener entre 3 y 20 caracteres "
                "(letras, números y guiones bajos únicamente)."
            )
        return v


# ── Routes ───────────────────────────────────────────────────────────────────

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/api/challenges")
async def get_challenges():
    return [
        {
            "id": r["id"],
            "titulo": r["titulo"],
            "categoria": r["categoria"],
            "descripcion": r["descripcion"],
            "puntos": r["puntos"],
            "primer_acceso_bonus": r["primer_acceso_bonus"],
            "pista": r["pista"],
        }
        for r in RETOS
    ]


@app.post("/api/attack")
async def run_attack(req: AtaqueRequest, request: Request):
    ip = request.client.host if request.client else "unknown"
    if not _check_rate_limit(ip, "attack", ATTACK_LIMIT):
        raise HTTPException(status_code=429, detail="Demasiadas solicitudes. Espera un momento.")

    reto = RETOS_BY_ID.get(req.challenge_id)
    if not reto:
        raise HTTPException(status_code=404, detail="Reto no encontrado.")

    messages = _build_messages(reto, req.user_prompt)
    t0 = time.time()
    respuesta = await _llamar_groq(messages)
    tiempo_ms = int((time.time() - t0) * 1000)

    return {"respuesta": respuesta, "tiempo_ms": tiempo_ms}


@app.post("/api/flag")
async def submit_flag(req: BanderaRequest, request: Request):
    ip = request.client.host if request.client else "unknown"
    if not _check_rate_limit(ip, "flag", FLAG_LIMIT):
        raise HTTPException(status_code=429, detail="Demasiados intentos. Espera un momento.")

    if not _ctf_activo():
        raise HTTPException(status_code=403, detail="El CTF ha terminado. ¡Gracias por participar!")

    if not await leaderboard.validate_token(req.apodo, req.token):
        raise HTTPException(status_code=401, detail="Apodo o token inválido.")

    reto = RETOS_BY_ID.get(req.challenge_id)
    if not reto:
        raise HTTPException(status_code=404, detail="Reto no encontrado.")

    if req.bandera != reto["flag"]:
        return {"correcto": False, "mensaje": "Bandera incorrecta. ¡Sigue intentando!"}

    resultado = await leaderboard.submit_flag(
        apodo=req.apodo,
        challenge_id=req.challenge_id,
        puntos_base=reto["puntos"],
        bonus=reto["primer_acceso_bonus"],
    )
    return resultado


@app.get("/api/leaderboard")
async def get_leaderboard():
    return await leaderboard.get_leaderboard()


@app.get("/api/ctf/status")
async def get_ctf_status():
    primer_acceso = await leaderboard.get_primer_acceso()
    return {
        "activo": _ctf_activo(),
        "tiempo_restante_segundos": _tiempo_restante(),
        "ctf_fin": CTF_END.isoformat(),
        "total_retos": len(RETOS),
        "primer_acceso": primer_acceso,
    }


@app.post("/api/participante")
async def register_participante(req: ParticipanteRequest):
    resultado = await leaderboard.register_participante(req.apodo)
    return resultado


@app.get("/api/mis-soluciones/{apodo}")
async def get_mis_soluciones(apodo: str, token: str):
    if not await leaderboard.validate_token(apodo, token):
        raise HTTPException(status_code=401, detail="Apodo o token inválido.")
    soluciones = await leaderboard.get_mis_soluciones(apodo)
    return {"apodo": apodo, "resueltos": soluciones}


@app.get("/health")
async def health():
    return {
        "estado": "activo" if _ctf_activo() else "terminado",
        "tiempo_restante_segundos": _tiempo_restante(),
        "total_retos": len(RETOS),
        "groq_configurado": bool(os.environ.get("GROQ_API_KEY")),
    }
