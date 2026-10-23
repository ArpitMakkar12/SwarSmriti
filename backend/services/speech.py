"""Speech-to-text with Vosk (free, runs on the server, English).

The browser converts recordings to WAV (16 kHz, mono, 16-bit) before
uploading, which is the format Vosk needs. The model is loaded the first
time someone speaks, not at startup, so the server boots fast.
"""
import io
import json
import os
import threading
import urllib.request
import wave
import zipfile

from vosk import KaldiRecognizer, Model, SetLogLevel

from errors import ServiceError

SetLogLevel(-1)  # silence Vosk's very chatty logs

BUNDLED_MODEL = os.path.join(os.path.dirname(__file__), "..", "vosk_model")
DOWNLOAD_DIR = "/tmp/vosk_model"
MODEL_URL = "https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip"

_model: Model | None = None
_lock = threading.Lock()


def _find_or_download_model() -> str:
    if os.path.isdir(os.path.join(BUNDLED_MODEL, "am")):
        return BUNDLED_MODEL  # the small English model committed in backend/vosk_model
    if not os.path.isdir(DOWNLOAD_DIR):
        zip_path = "/tmp/vosk_model.zip"
        urllib.request.urlretrieve(MODEL_URL, zip_path)
        with zipfile.ZipFile(zip_path) as z:
            z.extractall("/tmp")
        os.rename("/tmp/vosk-model-small-en-us-0.15", DOWNLOAD_DIR)
    return DOWNLOAD_DIR


def _get_model() -> Model:
    global _model
    with _lock:  # two requests at once must not load it twice
        if _model is None:
            _model = Model(_find_or_download_model())
    return _model


def transcribe_wav(wav_bytes: bytes) -> str:
    try:
        wf = wave.open(io.BytesIO(wav_bytes), "rb")
    except (wave.Error, EOFError) as e:
        raise ServiceError("Audio must be a WAV file.", 400) from e
    if wf.getnchannels() != 1 or wf.getsampwidth() != 2 or wf.getcomptype() != "NONE":
        raise ServiceError("Audio must be WAV, mono, 16-bit PCM.", 400)

    rec = KaldiRecognizer(_get_model(), wf.getframerate())
    parts = []
    while True:
        data = wf.readframes(4000)
        if not data:
            break
        if rec.AcceptWaveform(data):
            parts.append(json.loads(rec.Result()).get("text", ""))
    parts.append(json.loads(rec.FinalResult()).get("text", ""))
    return " ".join(p for p in parts if p).strip()