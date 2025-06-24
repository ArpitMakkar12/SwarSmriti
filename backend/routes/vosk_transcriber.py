import wave
import json
import os
import subprocess
import shutil
from vosk import Model, KaldiRecognizer

# Load Vosk model globally once
model = Model("backend/vosk_model")

def convert_to_wav(input_path: str) -> str:
    output_path = input_path.replace(".webm", ".wav")

    # Try to find ffmpeg in PATH
    ffmpeg_path = shutil.which("ffmpeg")
    if not ffmpeg_path:
        raise RuntimeError("❌ ffmpeg not found. Make sure it's in your system PATH.")

    command = [ffmpeg_path, "-i", input_path, "-ar", "16000", "-ac", "1", output_path]
    print("Running command:", " ".join(command))
    subprocess.run(command, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

    return output_path


def transcribe_from_path(file_path: str) -> str:
    wf = wave.open(file_path, "rb")

    if wf.getnchannels() != 1 or wf.getsampwidth() != 2 or wf.getcomptype() != "NONE":
        raise ValueError("Audio must be WAV format, mono channel, 16-bit PCM")

    rec = KaldiRecognizer(model, wf.getframerate())
    result = ""

    while True:
        data = wf.readframes(4000)
        if len(data) == 0:
            break
        if rec.AcceptWaveform(data):
            result += json.loads(rec.Result())["text"] + " "

    result += json.loads(rec.FinalResult())["text"]
    return result.strip()
