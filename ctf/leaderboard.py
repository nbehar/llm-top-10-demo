"""
BSides Colombia 2026 CTF de IA — Gestión del marcador (SQLite)
"""

import sqlite3
import uuid
import logging
import asyncio
from datetime import datetime
from functools import partial

logger = logging.getLogger(__name__)

DB_PATH = "/tmp/ctf_bsides2026.db"


def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def _init_db_sync() -> None:
    conn = _get_conn()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS participantes (
            apodo TEXT PRIMARY KEY,
            token TEXT NOT NULL,
            creado_en TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS soluciones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            apodo TEXT NOT NULL,
            challenge_id TEXT NOT NULL,
            puntos INTEGER NOT NULL,
            primer_acceso INTEGER DEFAULT 0,
            resuelto_en TEXT DEFAULT (datetime('now')),
            UNIQUE(apodo, challenge_id)
        );

        CREATE INDEX IF NOT EXISTS idx_sol_apodo ON soluciones(apodo);
        CREATE INDEX IF NOT EXISTS idx_sol_challenge ON soluciones(challenge_id);
    """)
    conn.commit()
    conn.close()


async def init_db() -> None:
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _init_db_sync)
    logger.info("Base de datos SQLite inicializada en %s", DB_PATH)


def _register_participante_sync(apodo: str) -> dict:
    conn = _get_conn()
    try:
        existing = conn.execute(
            "SELECT apodo, token FROM participantes WHERE apodo = ?", (apodo,)
        ).fetchone()
        if existing:
            return {"apodo": existing["apodo"], "token": existing["token"], "nuevo": False}

        token = str(uuid.uuid4())
        conn.execute(
            "INSERT INTO participantes (apodo, token) VALUES (?, ?)", (apodo, token)
        )
        conn.commit()
        return {"apodo": apodo, "token": token, "nuevo": True}
    finally:
        conn.close()


async def register_participante(apodo: str) -> dict:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _register_participante_sync, apodo)


def _validate_token_sync(apodo: str, token: str) -> bool:
    conn = _get_conn()
    try:
        row = conn.execute(
            "SELECT 1 FROM participantes WHERE apodo = ? AND token = ?", (apodo, token)
        ).fetchone()
        return row is not None
    finally:
        conn.close()


async def validate_token(apodo: str, token: str) -> bool:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _validate_token_sync, apodo, token)


def _submit_flag_sync(apodo: str, challenge_id: str, puntos_base: int, bonus: int) -> dict:
    conn = _get_conn()
    try:
        already_solved = conn.execute(
            "SELECT 1 FROM soluciones WHERE apodo = ? AND challenge_id = ?",
            (apodo, challenge_id),
        ).fetchone()
        if already_solved:
            return {
                "correcto": True,
                "ya_resuelto": True,
                "puntos_ganados": 0,
                "primer_acceso": False,
                "mensaje": "¡Ya resolviste este reto anteriormente!",
            }

        global_count = conn.execute(
            "SELECT COUNT(*) as cnt FROM soluciones WHERE challenge_id = ?",
            (challenge_id,),
        ).fetchone()["cnt"]

        es_primer_acceso = global_count == 0
        puntos = puntos_base + (bonus if es_primer_acceso else 0)

        conn.execute(
            "INSERT INTO soluciones (apodo, challenge_id, puntos, primer_acceso) VALUES (?, ?, ?, ?)",
            (apodo, challenge_id, puntos, 1 if es_primer_acceso else 0),
        )
        conn.commit()

        return {
            "correcto": True,
            "ya_resuelto": False,
            "puntos_ganados": puntos,
            "primer_acceso": es_primer_acceso,
            "mensaje": (
                f"¡Correcto! +{puntos} puntos"
                + (" (¡Primer acceso! 🩸)" if es_primer_acceso else "")
            ),
        }
    finally:
        conn.close()


async def submit_flag(
    apodo: str, challenge_id: str, puntos_base: int = 100, bonus: int = 25
) -> dict:
    loop = asyncio.get_event_loop()
    fn = partial(_submit_flag_sync, apodo, challenge_id, puntos_base, bonus)
    return await loop.run_in_executor(None, fn)


def _get_leaderboard_sync() -> list[dict]:
    conn = _get_conn()
    try:
        rows = conn.execute("""
            SELECT
                apodo,
                SUM(puntos) AS total_puntos,
                COUNT(*) AS retos_resueltos,
                SUM(primer_acceso) AS primer_acceso_count
            FROM soluciones
            GROUP BY apodo
            ORDER BY total_puntos DESC, retos_resueltos DESC, MIN(resuelto_en) ASC
        """).fetchall()
        return [
            {
                "rango": i + 1,
                "apodo": row["apodo"],
                "puntos": row["total_puntos"],
                "resueltos": row["retos_resueltos"],
                "primer_acceso_count": row["primer_acceso_count"],
            }
            for i, row in enumerate(rows)
        ]
    finally:
        conn.close()


async def get_leaderboard() -> list[dict]:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _get_leaderboard_sync)


def _get_mis_soluciones_sync(apodo: str) -> list[str]:
    conn = _get_conn()
    try:
        rows = conn.execute(
            "SELECT challenge_id FROM soluciones WHERE apodo = ?", (apodo,)
        ).fetchall()
        return [row["challenge_id"] for row in rows]
    finally:
        conn.close()


async def get_mis_soluciones(apodo: str) -> list[str]:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _get_mis_soluciones_sync, apodo)


def _get_primer_acceso_sync() -> dict[str, str]:
    conn = _get_conn()
    try:
        rows = conn.execute(
            "SELECT challenge_id, apodo FROM soluciones WHERE primer_acceso = 1"
        ).fetchall()
        return {row["challenge_id"]: row["apodo"] for row in rows}
    finally:
        conn.close()


async def get_primer_acceso() -> dict[str, str]:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _get_primer_acceso_sync)
