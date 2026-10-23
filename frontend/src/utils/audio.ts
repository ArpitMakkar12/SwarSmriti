/**
 * Browsers record audio as WebM/Opus (Chrome, Firefox) or MP4/AAC (Safari).
 * The server's speech model (Vosk) only understands WAV: mono, 16-bit.
 * This file converts a recording to that format right in the browser,
 * so the server doesn't need ffmpeg.
 */

/** Decode any recording and re-encode it as a mono 16-bit WAV at `sampleRate`. */
export async function blobToWav(blob: Blob, sampleRate = 16000): Promise<Blob> {
  const arrayBuffer = await blob.arrayBuffer();

  // 1. Decode the compressed recording into raw audio samples.
  const decodeCtx = new AudioContext();
  const decoded = await decodeCtx.decodeAudioData(arrayBuffer);
  await decodeCtx.close();

  // 2. Mix down to one channel and resample by "playing" it into an offline context.
  const frames = Math.ceil(decoded.duration * sampleRate);
  const offline = new OfflineAudioContext(1, Math.max(frames, 1), sampleRate);
  const source = offline.createBufferSource();
  source.buffer = decoded;
  source.connect(offline.destination);
  source.start();
  const rendered = await offline.startRendering();

  // 3. Write a WAV file: a 44-byte header followed by 16-bit samples.
  return encodeWav(rendered.getChannelData(0), sampleRate);
}

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeText = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };

  writeText(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeText(8, 'WAVE');
  writeText(12, 'fmt ');
  view.setUint32(16, 16, true); // size of the fmt section
  view.setUint16(20, 1, true); // format 1 = PCM (uncompressed)
  view.setUint16(22, 1, true); // 1 channel (mono)
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // bytes per second
  view.setUint16(32, 2, true); // bytes per sample
  view.setUint16(34, 16, true); // bits per sample
  writeText(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  // Float samples (-1..1) -> 16-bit integers (-32768..32767)
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

/** The server sends speech as base64 text; turn it into a URL an <audio> tag can play. */
export function base64ToAudioUrl(base64: string, mime = 'audio/mpeg'): string {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return URL.createObjectURL(new Blob([bytes], { type: mime }));
}