/**
 * TTS (Text-to-Speech) Service
 * Converts text to audio binary stream.
 */
export interface TTSService {
  synthesize(text: string): Promise<Buffer>;
}

export class MockTTSService implements TTSService {
  async synthesize(text: string): Promise<Buffer> {
    console.log(`[TTS] Synthesizing text: ${text}`);
    
    // Create a 1-second silent mono 16-bit 16kHz WAV file
    const sampleRate = 16000;
    const numSamples = sampleRate;
    const dataSize = numSamples * 2;
    const fileSize = 44 + dataSize;
    
    const buffer = Buffer.alloc(fileSize);
    
    // RIFF header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(fileSize - 8, 4);
    buffer.write('WAVE', 8);
    
    // fmt subchunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20); // PCM
    buffer.writeUInt16LE(1, 22); // Mono
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * 2, 28); // Byte rate
    buffer.writeUInt16LE(2, 32); // Block align
    buffer.writeUInt16LE(16, 34); // Bits per sample
    
    // data subchunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);
    
    // Silence data (already zeroed by Buffer.alloc)
    
    return buffer;
  }
}
