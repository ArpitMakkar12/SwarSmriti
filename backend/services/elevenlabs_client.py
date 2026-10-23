"""Talks to ElevenLabs: text-to-speech and voice cloning.

The API key is only ever sent in the request header. (The old code printed
it to the server logs on every start -- anyone with log access could read it.)
"""
import httpx

import config
from errors import ServiceError

BASE_URL = "https://api.elevenlabs.io/v1"
_client = httpx.Client(timeout=httpx.Timeout(90.0, connect=10.0))


def _headers() -> dict:
    if not config.ELEVENLABS_API_KEY:
        raise ServiceError("ELEVENLABS_API_KEY is not set on the server.", 500)
    return {"xi-api-key": config.ELEVENLABS_API_KEY}


def _explain(r: httpx.Response) -> str:
    try:
        detail = r.json().get("detail")
        msg = detail.get("message") if isinstance(detail, dict) else detail
    except ValueError:
        msg = None
    msg = msg or r.text[:200]
    if r.status_code == 401:
        return f"ElevenLabs rejected the request: {msg}"
    return f"ElevenLabs error {r.status_code}: {msg}"


def text_to_speech(text: str, voice_id: str | None = None) -> bytes:
    """Returns MP3 bytes spoken in the given voice (or the default voice)."""
    voice = voice_id or config.ELEVENLABS_DEFAULT_VOICE_ID
    try:
        r = _client.post(
            f"{BASE_URL}/text-to-speech/{voice}",
            params={"output_format": "mp3_44100_64"},  # small files, fine for speech
            headers={**_headers(), "Accept": "audio/mpeg"},
            json={
                "text": text,
                "model_id": config.ELEVENLABS_TTS_MODEL,
                "voice_settings": {"stability": 0.5, "similarity_boost": 0.8},
            },
        )
    except httpx.HTTPError as e:
        raise ServiceError(f"Could not reach ElevenLabs: {e.__class__.__name__}") from e
    if r.status_code >= 400:
        raise ServiceError(_explain(r))
    return r.content


def clone_voice(name: str, samples: list[tuple[str, bytes, str]]) -> str:
    """Instant Voice Cloning. samples = [(filename, bytes, content_type), ...].
    Needs a paid ElevenLabs plan (Starter or above)."""
    try:
        r = _client.post(
            f"{BASE_URL}/voices/add",
            headers=_headers(),
            data={
                "name": name,
                "remove_background_noise": "true",
                "description": "SwarSmriti persona voice",
            },
            files=[("files", (fn, content, ctype)) for fn, content, ctype in samples],
        )
    except httpx.HTTPError as e:
        raise ServiceError(f"Could not reach ElevenLabs: {e.__class__.__name__}") from e
    if r.status_code >= 400:
        msg = _explain(r)
        if r.status_code in (401, 403) and "clon" in msg.lower():
            msg += " (Voice cloning needs a paid ElevenLabs plan. Replies keep using the default voice.)"
        raise ServiceError(msg, 400 if r.status_code == 422 else 502)
    return r.json()["voice_id"]


def delete_voice(voice_id: str) -> None:
    try:
        r = _client.delete(f"{BASE_URL}/voices/{voice_id}", headers=_headers())
    except httpx.HTTPError as e:
        raise ServiceError(f"Could not reach ElevenLabs: {e.__class__.__name__}") from e
    if r.status_code >= 400 and r.status_code != 404:  # already gone is fine
        raise ServiceError(_explain(r))