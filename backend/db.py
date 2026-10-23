"""Database layer: Postgres + pgvector.

Tables:
  people    - each person being remembered: name, how they talk, their cloned voice
  memories  - one row per memory, belonging to one person, with an "embedding"
              (1024 numbers that capture its meaning) for finding related memories
  activity  - a small log that powers the Home page

To answer a question we embed it the same way and ask Postgres for that
person's memories whose vectors are closest (`<=>` = cosine distance).
Works with any Postgres that has the pgvector extension (Neon, Supabase, ...).
"""
from contextlib import contextmanager

from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

import config

_pool: ConnectionPool | None = None

SCHEMA = f"""
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS people (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    about       TEXT NOT NULL DEFAULT '',
    voice_id    TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS memories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id   UUID REFERENCES people(id) ON DELETE CASCADE,
    text        TEXT NOT NULL,
    summary     TEXT NOT NULL DEFAULT '',
    tags        TEXT[] NOT NULL DEFAULT '{{}}',
    source      TEXT NOT NULL DEFAULT 'text',
    embedding   vector({config.EMBED_DIM}) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activity (
    id          BIGSERIAL PRIMARY KEY,
    person_id   UUID REFERENCES people(id) ON DELETE CASCADE,
    kind        TEXT NOT NULL,
    detail      TEXT NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Databases created by the single-person version have these tables without person_id.
ALTER TABLE memories ADD COLUMN IF NOT EXISTS person_id UUID REFERENCES people(id) ON DELETE CASCADE;
ALTER TABLE activity ADD COLUMN IF NOT EXISTS person_id UUID REFERENCES people(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS memories_person_idx ON memories (person_id);
CREATE INDEX IF NOT EXISTS activity_person_idx ON activity (person_id);
"""


def _migrate_single_person(c) -> None:
    """The first version kept ONE person in a `profile` table and memories without an owner.
    If that data exists and there are no people yet, turn it into the first person."""
    if c.execute("SELECT 1 FROM people LIMIT 1").fetchone():
        return
    old = None
    if c.execute("SELECT to_regclass('public.profile') AS t").fetchone()["t"]:
        old = c.execute("SELECT name, about, voice_id FROM profile WHERE id = 1").fetchone()
    has_orphans = c.execute("SELECT 1 FROM memories WHERE person_id IS NULL LIMIT 1").fetchone()
    if not has_orphans and not (old and old["name"]):
        return
    person = c.execute(
        "INSERT INTO people (name, about, voice_id) VALUES (%s, %s, %s) RETURNING id",
        ((old and old["name"]) or "My loved one", (old and old["about"]) or "", old and old["voice_id"]),
    ).fetchone()
    c.execute("UPDATE memories SET person_id = %s WHERE person_id IS NULL", (person["id"],))
    c.execute("UPDATE activity SET person_id = %s WHERE person_id IS NULL", (person["id"],))


def init_db() -> None:
    """Open the connection pool, create/upgrade tables, move old single-person data over."""
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
        with c.transaction():
            c.execute(SCHEMA)
            _migrate_single_person(c)


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


# --- people -----------------------------------------------------------------
# Ids are compared as text (id::text = %s) so a malformed id simply finds nothing.

PERSON_COLUMNS = """p.id, p.name, p.about, p.voice_id, p.created_at,
    (SELECT count(*) FROM memories m WHERE m.person_id = p.id) AS memory_count"""


def _person_row(r: dict) -> dict:
    return {
        "id": str(r["id"]),
        "name": r["name"],
        "about": r["about"],
        "voice_id": r["voice_id"],  # stays on the server; routes send only has_cloned_voice
        "memory_count": r["memory_count"],
        "created_at": r["created_at"].isoformat(),
    }


def list_people() -> list[dict]:
    with conn() as c:
        rows = c.execute(f"SELECT {PERSON_COLUMNS} FROM people p ORDER BY p.created_at").fetchall()
    return [_person_row(r) for r in rows]


def get_person(person_id: str) -> dict | None:
    with conn() as c:
        r = c.execute(f"SELECT {PERSON_COLUMNS} FROM people p WHERE p.id::text = %s", (person_id,)).fetchone()
    return _person_row(r) if r else None


def create_person(name: str, about: str) -> dict:
    with conn() as c:
        r = c.execute("INSERT INTO people (name, about) VALUES (%s, %s) RETURNING id", (name, about)).fetchone()
    return get_person(str(r["id"]))


def update_person(person_id: str, name: str, about: str) -> dict | None:
    with conn() as c:
        c.execute("UPDATE people SET name = %s, about = %s WHERE id::text = %s", (name, about, person_id))
    return get_person(person_id)


def delete_person(person_id: str) -> None:
    """Removes the person and, through ON DELETE CASCADE, all their memories and activity."""
    with conn() as c:
        c.execute("DELETE FROM people WHERE id::text = %s", (person_id,))


def set_voice_id(person_id: str, voice_id: str | None) -> None:
    with conn() as c:
        c.execute("UPDATE people SET voice_id = %s WHERE id::text = %s", (voice_id, person_id))


# --- memories ---------------------------------------------------------------

def _memory_row(r: dict) -> dict:
    return {
        "id": str(r["id"]),
        "person_id": str(r["person_id"]),
        "text": r["text"],
        "summary": r["summary"],
        "tags": r["tags"],
        "source": r["source"],
        "timestamp": r["created_at"].isoformat(),
    }


def add_memory(person_id: str, text: str, summary: str, tags: list[str], source: str, embedding: list[float]) -> dict:
    with conn() as c:
        row = c.execute(
            """INSERT INTO memories (person_id, text, summary, tags, source, embedding)
               VALUES (%s, %s, %s, %s, %s, %s::vector)
               RETURNING id, person_id, text, summary, tags, source, created_at""",
            (person_id, text, summary, tags, source, _vec(embedding)),
        ).fetchone()
    return _memory_row(row)


def list_memories(person_id: str) -> list[dict]:
    with conn() as c:
        rows = c.execute(
            """SELECT id, person_id, text, summary, tags, source, created_at FROM memories
               WHERE person_id::text = %s ORDER BY created_at DESC""",
            (person_id,),
        ).fetchall()
    return [_memory_row(r) for r in rows]


def delete_memory(memory_id: str) -> bool:
    with conn() as c:
        cur = c.execute("DELETE FROM memories WHERE id::text = %s", (memory_id,))
    return cur.rowcount > 0


def search_memories(person_id: str, query_embedding: list[float], limit: int) -> list[dict]:
    """This person's closest memories first. distance 0 = same meaning, 2 = opposite."""
    with conn() as c:
        rows = c.execute(
            """SELECT id, person_id, text, summary, tags, source, created_at,
                      embedding <=> %s::vector AS distance
               FROM memories WHERE person_id::text = %s
               ORDER BY distance LIMIT %s""",
            (_vec(query_embedding), person_id, limit),
        ).fetchall()
    return [{**_memory_row(r), "distance": float(r["distance"])} for r in rows]


# --- activity log + stats (powers the Home page) -----------------------------

def log_activity(person_id: str, kind: str, detail: str) -> None:
    detail = detail.strip().replace("\n", " ")
    if len(detail) > 120:
        detail = detail[:117] + "..."
    with conn() as c:
        c.execute("INSERT INTO activity (person_id, kind, detail) VALUES (%s, %s, %s)", (person_id, kind, detail))


def get_stats(person_id: str) -> dict:
    with conn() as c:
        m = c.execute(
            """SELECT count(*) AS memories,
                      coalesce(sum(length(text)), 0) AS characters,
                      count(*) FILTER (WHERE source = 'voice') AS voice_memories
               FROM memories WHERE person_id::text = %s""",
            (person_id,),
        ).fetchone()
        tags = c.execute(
            "SELECT count(DISTINCT t) AS n FROM memories, unnest(tags) AS t WHERE person_id::text = %s", (person_id,)
        ).fetchone()
        a = c.execute(
            """SELECT count(*) FILTER (WHERE kind IN ('chat', 'voice_chat')) AS conversations,
                      count(DISTINCT created_at::date) AS active_days
               FROM activity WHERE person_id::text = %s""",
            (person_id,),
        ).fetchone()
        recent = c.execute(
            "SELECT kind, detail, created_at FROM activity WHERE person_id::text = %s ORDER BY created_at DESC LIMIT 6",
            (person_id,),
        ).fetchall()
    return {
        "memories": m["memories"],
        "voice_memories": m["voice_memories"],
        "characters": int(m["characters"]),
        "unique_tags": tags["n"],
        "conversations": a["conversations"],
        "active_days": a["active_days"],
        "recent_activity": [
            {"kind": r["kind"], "detail": r["detail"], "timestamp": r["created_at"].isoformat()} for r in recent
        ],
    }