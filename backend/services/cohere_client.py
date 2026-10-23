"""Talks to Cohere: embeddings (meaning-vectors) and chat (the LLM).

Uses Cohere's v2 API. The old code used /v1/summarize and the `command-r`
model, which Cohere has deprecated -- that is why training stopped working.
"""
import json
import re

import httpx

import config
from errors import ServiceError

BASE_URL = "https://api.cohere.com/v2"
_client = httpx.Client(timeout=httpx.Timeout(60.0, connect=10.0))


def _post(path: str, payload: dict) -> dict:
    if not config.COHERE_API_KEY:
        raise ServiceError("COHERE_API_KEY is not set on the server.", 500)
    try:
        r = _client.post(
            f"{BASE_URL}{path}",
            headers={"Authorization": f"Bearer {config.COHERE_API_KEY}", "X-Client-Name": "swarsmriti"},
            json=payload,
        )
    except httpx.HTTPError as e:
        raise ServiceError(f"Could not reach Cohere: {e.__class__.__name__}") from e
    if r.status_code == 401:
        raise ServiceError("Cohere rejected the API key (it may have been revoked). Set a new COHERE_API_KEY.")
    if r.status_code == 429:
        raise ServiceError("Cohere rate limit reached. Wait a minute and try again.", 429)
    if r.status_code >= 400:
        raise ServiceError(f"Cohere error {r.status_code}: {r.text[:200]}")
    return r.json()


def embed(texts: list[str], input_type: str) -> list[list[float]]:
    """input_type is 'search_document' when storing, 'search_query' when asking."""
    payload = {
        "model": config.COHERE_EMBED_MODEL,
        "texts": texts,
        "input_type": input_type,
        "embedding_types": ["float"],
    }
    if config.COHERE_EMBED_MODEL.startswith("embed-v4"):
        payload["output_dimension"] = config.EMBED_DIM
    data = _post("/embed", payload)
    return data["embeddings"]["float"]


def chat(messages: list[dict], temperature: float = 0.6, max_tokens: int = 400) -> str:
    """messages = [{"role": "system"|"user"|"assistant", "content": "..."}]"""
    data = _post(
        "/chat",
        {
            "model": config.COHERE_CHAT_MODEL,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        },
    )
    parts = data.get("message", {}).get("content", []) or []
    text = "".join(p.get("text", "") for p in parts if p.get("type") == "text").strip()
    if not text:
        raise ServiceError("Cohere returned an empty reply.")
    return text


SUMMARY_PROMPT = """Read this personal memory and reply with ONLY a JSON object, no other text:
{"summary": "<one warm sentence, max 25 words, written in third person>",
 "tags": ["<2 to 4 short lowercase topic words>"]}

Memory:
"""


def summarize_and_tag(text: str) -> tuple[str, list[str]]:
    """One LLM call that returns a short summary + suggested tags."""
    reply = chat([{"role": "user", "content": SUMMARY_PROMPT + text}], temperature=0.2, max_tokens=200)
    match = re.search(r"\{.*\}", reply, re.DOTALL)
    try:
        data = json.loads(match.group(0)) if match else {}
    except json.JSONDecodeError:
        data = {}
    summary = str(data.get("summary") or "").strip() or text[:140].strip() + "..."
    tags = [str(t).strip().lower() for t in data.get("tags", []) if str(t).strip()][:4]
    return summary, tags