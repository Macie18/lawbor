/**
 * STT (Speech-to-Text) Service
 * Converts audio binary stream to text.
 */
export interface STTService {
  transcribe(audioBuffer: Buffer): Promise<string>;
}

export class MockSTTService implements STTService {
  private callCount = 0;

  async transcribe(audioBuffer: Buffer): Promise<string> {
    this.callCount++;
    console.log(`[STT] Transcribing ${audioBuffer.length} bytes (Call #${this.callCount})...`);
    
    // Simulate that user says something every 2 calls (approx 5s)
    if (this.callCount % 2 === 0) {
      const phrases = [
        "你好，我想咨询一下关于裁员赔偿的问题。",
        "公司现在要求我签离职协议，但我不想签。",
        "如果我不签，公司会怎么处理？",
        "我已经在公司工作五年了，赔偿金应该是多少？"
      ];
      return phrases[Math.floor(Math.random() * phrases.length)];
    }
    
    return "";
  }
}
