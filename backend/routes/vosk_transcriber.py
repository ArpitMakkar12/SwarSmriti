import wave
import json
import zipfile
import urllib.request
import os
import subprocess
import shutil
from vosk import Model, KaldiRecognizer


MODEL_PATH = "/tmp/vosk_model"
MODEL_URL = "https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip"
# Load Vosk model globally once
def setup_vosk_model():
    if not os.path.exists(MODEL_PATH):
        print("🔽 Downloading Vosk model...")
        zip_path = "/tmp/vosk_model.zip"
        urllib.request.urlretrieve(MODEL_URL, zip_path)

        print("📦 Extracting Vosk model...")
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall("/tmp")

        # Rename extracted folder to standard path
        os.rename("/tmp/vosk-model-small-en-us-0.15", MODEL_PATH)
        print("✅ Model ready.")

    else:
        print("✅ Vosk model already available.")

    return Model(MODEL_PATH)

model = setup_vosk_model()

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
