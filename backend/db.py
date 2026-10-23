"""Database layer: Postgres + pgvector.

Every memory is stored as a row with its text, summary, tags and an
"embedding" (a list of 1024 numbers that captures its meaning). To find
memories related to a question we embed the question the same way and ask
Postgres for the rows whose vectors are closest (`<=>` = cosine distance).

Works with any Postgres that has the pgvector extension (Neon, Supabase, ...).
"""
from contextlib import contextmanager

from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

import config

_pool: ConnectionPool | None = None

SCHEMA = f"""
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS memories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text        TEXT NOT NULL,
    summary     TEXT NOT NULL DEFAULT '',
    tags        TEXT[] NOT NULL DEFAULT '{{}}',
    source      TEXT NOT NULL DEFAULT 'text',
    embedding   vector({config.EMBED_DIM}) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profile (
    id          INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    name        TEXT NOT NULL DEFAULT '',
    about       TEXT NOT NULL DEFAULT '',
    voice_id    TEXT,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO profile (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS activity (
    id          BIGSERIAL PRIMARY KEY,
    kind        TEXT NOT NULL,
    detail      TEXT NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
"""


def init_db() -> None:
    """Open the connection pool and create tables if they don't exist yet."""
    global _pool
    if not config.DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not set. Add it to backend/.env or Render's Environment tab.")
    _pool = ConnectionPool(
        config.DATABASE_URL,
        min_size=1,
        max_size=5,
        # Neon/Supabase close idle connections; this re-checks each one before use.
        check=ConnectionPool.check_connection,
        kwargs={"autocommit": True, "row_factory": dict_row},
        open=True,
    )
    with conn() as c:
        c.execute(SCHEMA)


def close_db() -> None:
    if _pool:
        _pool.close()


@contextmanager
def conn():
    if _pool is None:
        raise RuntimeError("Database not initialised")
    with _pool.connection() as c:
        yield c


def _vec(values: list[float]) -> str:
    """pgvector accepts vectors written like '[0.1,0.2,...]'."""
    return "[" + ",".join(f"{v:.7f}" for v in values) + "]"


def _memory_row(r: dict) -> dict:
    return {
        "id": str(r["id"]),
        "text": r["text"],
        "summary": r["summary"],
        "tags": r["tags"],
        "source": r["source"],
        "timestamp": r["created_at"].isoformat(),
    }


# --- memories ---------------------------------------------------------------

def add_memory(text: str, summary: str, tags: list[str], source: str, embedding: list[float]) -> dict:
    with conn() as c:
        row = c.execute(
            """INSERT INTO memories (text, summary, tags, source, embedding)
               VALUES (%s, %s, %s, %s, %s::vector)
               RETURNING id, text, summary, tags, source, created_at""",
            (text, summary, tags, source, _vec(embedding)),
        ).fetchone()
    return _memory_row(row)


def list_memories() -> list[dict]:
    with conn() as c:
        rows = c.execute(
            "SELECT id, text, summary, tags, source, created_at FROM memories ORDER BY created_at DESC"
        ).fetchall()
    return [_memory_row(r) for r in rows]


def delete_memory(memory_id: str) -> bool:
    with conn() as c:
        cur = c.execute("DELETE FROM memories WHERE id::text = %s", (memory_id,))
    return cur.rowcount > 0


def search_memories(query_embedding: list[float], limit: int) -> list[dict]:
    """Closest memories first. distance 0 = same meaning, 2 = opposite."""
    with conn() as c:
        rows = c.execute(
            """SELECT id, text, summary, tags, source, created_at,
                      embedding <=> %s::vector AS distance
               FROM memories ORDER BY distance LIMIT %s""",
            (_vec(query_embedding), limit),
        ).fetchall()
    return [{**_memory_row(r), "distance": float(r["distance"])} for r in rows]


# --- profile (who the doppelganger is) --------------------------------------

def get_profile() -> dict:
    with conn() as c:
        r = c.execute("SELECT name, about, voice_id FROM profile WHERE id = 1").fetchone()
    return {"name": r["name"], "about": r["about"], "voice_id": r["voice_id"]}


def update_profile(name: str, about: str) -> dict:
    with conn() as c:
        c.execute(
            "UPDATE profile SET name = %s, about = %s, updated_at = now() WHERE id = 1",
            (name, about),
        )
    return get_profile()


def set_voice_id(voice_id: str | None) -> None:
    with conn() as c:
        c.execute("UPDATE profile SET voice_id = %s, updated_at = now() WHERE id = 1", (voice_id,))


# --- activity log + stats (powers the dashboard) -----------------------------

def log_activity(kind: str, detail: str) -> None:
    detail = detail.strip().replace("\n", " ")
    if len(detail) > 120:
        detail = detail[:117] + "..."
    with conn() as c:
        c.execute("INSERT INTO activity (kind, detail) VALUES (%s, %s)", (kind, detail))


def get_stats() -> dict:
    with conn() as c:
        m = c.execute(
            """SELECT count(*) AS memories,
                      coalesce(sum(length(text)), 0) AS characters,
                      count(*) FILTER (WHERE source = 'voice') AS voice_memories
               FROM memories"""
        ).fetchone()
        tags = c.execute("SELECT count(DISTINCT t) AS n FROM memories, unnest(tags) AS t").fetchone()
        a = c.execute(
            """SELECT count(*) FILTER (WHERE kind IN ('chat', 'voice_chat')) AS conversations,
                      count(DISTINCT created_at::date) AS active_days
               FROM activity"""
        ).fetchone()
        recent = c.execute(
            "SELECT kind, detail, created_at FROM activity ORDER BY created_at DESC LIMIT 6"
        ).fetchall()
    return {
        "memories": m["memories"],
        "voice_memories": m["voice_memories"],
        "characters": int(m["characters"]),
        "unique_tags": tags["n"],
        "conversations": a["conversations"],
        "active_days": a["active_days"],
        "recent_activity": [
            {"kind": r["kind"], "detail": r["detail"], "timestamp": r["created_at"].isoformat()}
            for r in recent
        ],
    }