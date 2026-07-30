/**
 * generate_sounds.js
 * Generates a two-tone notification chime as a WAV file.
 * No external dependencies — pure Node.js Buffer manipulation.
 *
 * Output: public/sounds/notification.wav
 */

const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;
const NUM_CHANNELS = 1;
const BIT_DEPTH = 16;

/**
 * Generates PCM samples for a sine wave tone with an exponential decay envelope.
 * @param {number} freq - Frequency in Hz
 * @param {number} startSample - Sample offset to start at
 * @param {number} durationSec - Duration in seconds
 * @param {number} peakAmplitude - Peak amplitude (0–1)
 * @param {Int16Array} output - PCM buffer to write into
 */
function addTone(freq, startSample, durationSec, peakAmplitude, output) {
  const numSamples = Math.floor(SAMPLE_RATE * durationSec);
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    // Sine wave
    const sine = Math.sin(2 * Math.PI * freq * t);
    // Exponential decay: e^(-k*t), k chosen so amplitude reaches ~1% at end
    const k = Math.log(100) / durationSec;
    const envelope = Math.exp(-k * t);
    const sample = sine * envelope * peakAmplitude;
    const sampleIdx = startSample + i;
    if (sampleIdx < output.length) {
      // Clamp and accumulate (for mixing)
      const existing = output[sampleIdx] / 32767;
      const mixed = Math.max(-1, Math.min(1, existing + sample));
      output[sampleIdx] = Math.round(mixed * 32767);
    }
  }
}

/**
 * Writes a WAV file from a PCM Int16Array.
 */
function writeWav(filePath, samples) {
  const dataSize = samples.length * 2; // 2 bytes per 16-bit sample
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);        // chunk size
  buffer.writeUInt16LE(1, 20);         // PCM format
  buffer.writeUInt16LE(NUM_CHANNELS, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * NUM_CHANNELS * BIT_DEPTH / 8, 28); // byte rate
  buffer.writeUInt16LE(NUM_CHANNELS * BIT_DEPTH / 8, 32); // block align
  buffer.writeUInt16LE(BIT_DEPTH, 34);
  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  // PCM samples
  for (let i = 0; i < samples.length; i++) {
    buffer.writeInt16LE(samples[i], 44 + i * 2);
  }

  fs.writeFileSync(filePath, buffer);
  console.log(`Written: ${filePath} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

// Total duration: 1.0s  (silence padded to 1.2s total)
const TOTAL_DURATION = 1.2;
const totalSamples = Math.floor(SAMPLE_RATE * TOTAL_DURATION);
const pcm = new Int16Array(totalSamples);

// Chime: E5 (659.25 Hz) at t=0 for 0.65s, G5 (783.99 Hz) at t=0.18s for 0.80s
// Slight overlap creates a bright bell chord
addTone(659.25,  0,                              0.65, 0.6, pcm);
addTone(783.99,  Math.floor(0.18 * SAMPLE_RATE), 0.80, 0.5, pcm);
// A light undertone (A4, 440 Hz) at t=0 for 0.3s gives warmth
addTone(440,     0,                              0.30, 0.25, pcm);

const outDir = path.join(__dirname, '..', 'public', 'sounds');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

writeWav(path.join(outDir, 'notification.wav'), pcm);

console.log('Sound generation complete.');
console.log('NOTE: Copy notification.wav to notification.mp3 manually,');
console.log('      or use ffmpeg: ffmpeg -i notification.wav notification.mp3');
