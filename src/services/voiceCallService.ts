import { STTService, MockSTTService } from './sttService';
import { LLMService, MockLLMService, LLMMessage } from './llmService';
import { TTSService, MockTTSService } from './ttsService';

/**
 * Voice Call Service
 * Manages the STT -> LLM -> TTS pipeline for a single session.
 */
export class VoiceCallService {
  private stt: STTService;
  private llm: LLMService;
  private tts: TTSService;
  private history: LLMMessage[] = [];
  private audioBuffer: Buffer[] = [];

  constructor() {
    this.stt = new MockSTTService();
    this.llm = new MockLLMService();
    this.tts = new MockTTSService();
    this.history.push({ role: 'system', content: '你是一个资深劳动法律顾问，正在进行模拟通话。' });
  }

  setConfig(config: { temperament: number }) {
    const style = config.temperament < 30 ? "温和引导型" :
                  config.temperament < 70 ? "专业严谨型" : "极限施压型";
    this.history = []; // Reset history for new session
    this.history.push({ 
      role: 'system', 
      content: `你是一个资深面试官，风格是 ${style}。性格阈值为 ${config.temperament}/100。请根据这个性格对面试者进行提问。` 
    });
  }

  async processAudioChunk(chunk: Buffer): Promise<{ text: string, audio: Buffer } | null> {
    this.audioBuffer.push(chunk);

    // Simple VAD: If chunk is small or we have enough data, transcribe
    // In a real app, we'd use a proper VAD (Voice Activity Detection)
    if (this.audioBuffer.length >= 10) { // Every 2.5s (assuming 250ms chunks)
      const fullBuffer = Buffer.concat(this.audioBuffer);
      this.audioBuffer = [];

      const userText = await this.stt.transcribe(fullBuffer);
      if (userText) {
        this.history.push({ role: 'user', content: userText });
        const aiText = await this.llm.generateResponse(this.history);
        this.history.push({ role: 'assistant', content: aiText });
        const audio = await this.tts.synthesize(aiText);
        return { text: aiText, audio };
      }
    }
    return null;
  }

  async generateFinalReport(): Promise<string> {
    return await this.llm.generateReport(this.history);
  }
}
