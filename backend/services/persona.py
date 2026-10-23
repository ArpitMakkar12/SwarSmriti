"""The doppelganger's brain: turns a question into an in-character answer.

Steps for every message (text or voice):
  1. embed the question            -> numbers that capture its meaning
  2. find the closest memories     -> Postgres + pgvector
  3. build a system prompt that tells the LLM to speak AS the person,
     using only those memories
  4. ask Cohere for the reply
  5. turn the reply into speech in the person's (cloned) voice
"""
import base64

import config
import db
from errors import ServiceError
from services import cohere_client, elevenlabs_client


def _system_prompt(profile: dict, memories: list[dict]) -> str:
    name = profile["name"].strip() or "the person who trained you"
    about = profile["about"].strip()

    if memories:
        memory_lines = "\n".join(
            f"- [{', '.join(m['tags']) or 'memory'}] {m['text']}" for m in memories
        )
    else:
        memory_lines = "(No memories have been shared yet.)"

    return f"""You are {name}. You are an AI keepsake built from {name}'s own memories, so that the people who love {name} can keep talking with them.

How to speak:
- Always speak in the first person, as {name}, warmly and naturally, like talking to someone close to you.
- Keep replies short and conversational (2-5 sentences); they are read aloud.
- Personal facts (names, places, dates, events, opinions) must come from the memories below. Never invent them.
- If asked about something the memories don't cover, say kindly that you don't remember that or haven't shared it yet, and talk about something related you do remember.
- If the person seems sad or grieving, be gentle and comforting.
- Don't mention "memories", "context" or "database". But if someone sincerely asks whether you are real or an AI, be honest that you are an AI made from {name}'s memories.

About {name}:
{about or "(not filled in yet)"}

{name}'s memories most related to this conversation:
{memory_lines}"""


def answer(question: str, history: list[dict]) -> dict:
    profile = db.get_profile()

    query_vec = cohere_client.embed([question], "search_query")[0]
    memories = db.search_memories(query_vec, config.MEMORIES_PER_ANSWER)

    messages = [{"role": "system", "content": _system_prompt(profile, memories)}]
    for turn in history[-10:]:  # last few turns so the conversation flows
        if turn.get("role") in ("user", "assistant") and turn.get("content"):
            messages.append({"role": turn["role"], "content": str(turn["content"])[:2000]})
    messages.append({"role": "user", "content": question})

    reply = cohere_client.chat(messages)

    # Voice is a bonus: if ElevenLabs fails (quota, plan, key) the text still arrives.
    audio_b64, audio_error = None, None
    try:
        mp3 = elevenlabs_client.text_to_speech(reply, profile["voice_id"])
        audio_b64 = base64.b64encode(mp3).decode("ascii")
    except ServiceError as e:
        audio_error = e.message

    return {
        "answer": reply,
        "audio_base64": audio_b64,
        "audio_error": audio_error,
        "memories_used": [m["summary"] for m in memories],
    }